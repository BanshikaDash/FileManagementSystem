#include <stdio.h>
#include <stdlib.h>
#include <string.h>
typedef struct Node {
    char name[50];
    int isDirectory;
    struct Node* parent;
    struct Node* firstChild;
    struct Node* nextSibling;
} Node;
Node* createNode(const char* name, int isDirectory) 
{
    Node* node = (Node*)malloc(sizeof(Node));
    strcpy(node->name, name);
    node->isDirectory = isDirectory;
    node->parent = NULL;
    node->firstChild = NULL;
    node->nextSibling = NULL;
    return node;
}
void addFile(Node* parent, const char* name, int isDirectory) 
{
    Node* temp = parent->firstChild;
    while (temp) 
    {
        if (strcmp(temp->name, name) == 0) 
        {
            printf("Warning: %s already exists in %s.\n", name, parent->name);
            return;
        }
        temp = temp->nextSibling;
    }
    Node* node = createNode(name, isDirectory);
    node->parent = parent;
    if (parent->firstChild == NULL) 
    {
        parent->firstChild = node;
    } 
    else 
    {
        temp = parent->firstChild;
        while (temp->nextSibling) temp = temp->nextSibling;
        temp->nextSibling = node;
    }
}
void deleteNode(Node* node) 
{
    if (node->firstChild) 
    {
        Node* temp = node->firstChild;
        while (temp) 
        {
            Node* next = temp->nextSibling;
            deleteNode(temp);
            temp = next;
        }
    }
    free(node);
}
void deleteFile(Node* parent, const char* name) 
{
    Node* temp = parent->firstChild, *prev = NULL;
    while (temp && strcmp(temp->name, name) != 0) 
    {
        prev = temp;
        temp = temp->nextSibling;
    }
    if (temp) 
    {
        if (prev) prev->nextSibling = temp->nextSibling;
        else parent->firstChild = temp->nextSibling;
        deleteNode(temp);
    } 
    else 
    {
        printf("Error: %s not found in %s.\n", name, parent->name);
    }
}
void listContents(Node* node) 
{
    Node* temp = node->firstChild;
    while (temp) 
    {
        printf("%s%s\n", temp->name, temp->isDirectory ? "/" : "");
        temp = temp->nextSibling;
    }
}
void findDirectories(Node* node, Node** found, int* count) 
{
    if (node == NULL) return;
    if (node->isDirectory) 
    {
        found[*count] = node;
        (*count)++;
    }
    findDirectories(node->firstChild, found, count);
    findDirectories(node->nextSibling, found, count);
}
Node* changeDirectory(Node* current) 
{
    Node* found[100]; 
    int count = 0;
    if (current->firstChild != NULL) 
    {
        findDirectories(current->firstChild, found, &count);
    }
    if (current->parent != NULL)
    {
        found[count++] = current->parent;
    }
    if (count == 0) 
    {
        printf("No directories found.\n");
        return current;
    }
    printf("Available directories:\n");
    for (int i = 0; i < count; i++) 
    {
        printf("%d. %s\n", i + 1, found[i]->name);
    }
    int choice;
    printf("Select a directory by number (0 to stay in current): ");
    scanf("%d", &choice);
    if (choice > 0 && choice <= count) 
    {
        return found[choice - 1];
    }
    return current;
}
int main() 
{
    Node* root = createNode("DIRECTORY", 1);
    Node* current = root;
    int choice;
    char name[50];
    while (1) 
    {
        printf("Current directory: %s\n", current->name);
        printf("1. Add Directory\n2. Add File\n3. Delete\n4. List\n5. Change Directory\n6. Exit\nChoose an option: ");
        scanf("%d", &choice);
        switch (choice) 
        {
            case 1:
                printf("Enter directory name to add under %s: ", current->name);
                scanf("%s", name);
                addFile(current, name, 1);
                break;
            case 2:
                printf("Enter file name to add under %s: ", current->name);
                scanf("%s", name);
                addFile(current, name, 0);
                break;
            case 3:
                printf("Enter name to delete from %s: ", current->name);
                scanf("%s", name);
                deleteFile(current, name);
                break;
            case 4:
                printf("Contents of %s:\n", current->name);
                listContents(current);
                break;
            case 5:
                current = changeDirectory(current);
                break;
            case 6:
                deleteNode(root);
                return 0;
        }
    }
}