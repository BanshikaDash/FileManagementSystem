import { useState, useEffect } from "react";
import { FolderIcon, FileIcon, FolderPlus, FilePlus, Trash2, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface FileItem {
  name: string;
  type: "file" | "directory";
}

interface FileSystem {
  [key: string]: FileItem[];
}

const API_URL = "http://localhost:3001/api";

const FileManagementSystem = () => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [fileSystem, setFileSystem] = useState<FileSystem>({});
  const [loading, setLoading] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addItemType, setAddItemType] = useState<"file" | "directory">("directory");
  const [newItemName, setNewItemName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const getCurrentPathString = () => currentPath.join("/");
  const getCurrentItems = () => fileSystem[getCurrentPathString()] || [];

  // Fetch file system from backend
  const fetchFileSystem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/filesystem`);
      const result = await response.json();
      
      if (result.success) {
        setFileSystem(result.data);
      } else {
        toast.error("Failed to load file system");
      }
    } catch (error) {
      toast.error("Cannot connect to backend server");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load file system on component mount
  useEffect(() => {
    fetchFileSystem();
  }, []);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: getCurrentPathString(),
          name: newItemName,
          type: addItemType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        await fetchFileSystem(); // Refresh file system
        setShowAddDialog(false);
        setNewItemName("");
      } else {
        toast.error(result.error || "Failed to add item");
      }
    } catch (error) {
      toast.error("Cannot connect to backend server");
      console.error("Error:", error);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`${API_URL}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: getCurrentPathString(),
          name: itemToDelete,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        await fetchFileSystem(); // Refresh file system
        setShowDeleteDialog(false);
        setItemToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete item");
      }
    } catch (error) {
      toast.error("Cannot connect to backend server");
      console.error("Error:", error);
    }
  };

  const navigateToDirectory = (dirName: string) => {
    setCurrentPath([...currentPath, dirName]);
  };

  const navigateToParent = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const openAddDialog = (type: "file" | "directory") => {
    setAddItemType(type);
    setNewItemName("");
    setShowAddDialog(true);
  };

  const openDeleteDialog = (itemName: string) => {
    setItemToDelete(itemName);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading file system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary h-16 flex items-center px-6 shadow-lg">
        <div className="max-w-7xl w-full mx-auto flex items-center">
          <h1 className="text-2xl font-bold text-primary-foreground mr-8">File Management System</h1>
          <nav className="flex items-center gap-2 text-primary-foreground/90">
            <button
              onClick={() => setCurrentPath([])}
              className="hover:text-primary-foreground transition-colors"
            >
              Root
            </button>
            {currentPath.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-primary-foreground/60">/</span>
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className="hover:text-primary-foreground transition-colors"
                >
                  {segment}
                </button>
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto flex gap-6 p-6">
        {/* Sidebar */}
        <aside className="w-72 space-y-3 flex-shrink-0">
          <Button
            variant="action"
            className="w-full justify-start"
            size="lg"
            onClick={() => openAddDialog("directory")}
          >
            <FolderPlus className="mr-2 h-5 w-5" />
            Add Directory
          </Button>

          <Button
            variant="action"
            className="w-full justify-start"
            size="lg"
            onClick={() => openAddDialog("file")}
          >
            <FilePlus className="mr-2 h-5 w-5" />
            Add File
          </Button>

          <Button
            variant="action"
            className="w-full justify-start"
            size="lg"
            onClick={navigateToParent}
            disabled={currentPath.length === 0}
          >
            <ArrowUp className="mr-2 h-5 w-5" />
            Go to Parent
          </Button>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <h2 className="text-2xl font-bold text-primary mb-6">
            {currentPath.length === 0 ? "Root Directory" : currentPath[currentPath.length - 1]}
          </h2>

          {getCurrentItems().length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">This directory is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {getCurrentItems().map((item) => (
                <div
                  key={item.name}
                  className="group relative bg-card rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer"
                >
                  <div
                    onClick={() => item.type === "directory" && navigateToDirectory(item.name)}
                    className="p-6 flex flex-col items-center justify-center h-32"
                  >
                    {item.type === "directory" ? (
                      <FolderIcon className="h-12 w-12 text-primary mb-2" />
                    ) : (
                      <FileIcon className="h-12 w-12 text-primary mb-2" />
                    )}
                    <span className="text-sm text-center text-foreground font-medium line-clamp-2">
                      {item.name}{item.type === "directory" ? "/" : ""}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => openDeleteDialog(item.name)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-destructive rounded-md hover:bg-destructive/90"
                  >
                    <Trash2 className="h-4 w-4 text-destructive-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">
              Add New {addItemType === "directory" ? "Directory" : "File"}
            </DialogTitle>
            <DialogDescription>
              Enter a name for the new {addItemType === "directory" ? "directory" : "file"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={addItemType === "directory" ? "New Folder" : "document.txt"}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className="focus-visible:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add {addItemType === "directory" ? "Directory" : "File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemToDelete}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FileManagementSystem;