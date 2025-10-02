const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File system structure (mimicking C program's tree structure)
class FileNode {
  constructor(name, isDirectory = false) {
    this.name = name;
    this.isDirectory = isDirectory;
    this.children = [];
  }
}

// Initialize root directory
let root = new FileNode('ROOT', true);

// Helper function to find a node by path
function findNodeByPath(pathArray) {
  let current = root;
  
  for (const segment of pathArray) {
    if (!current.isDirectory) return null;
    const child = current.children.find(c => c.name === segment);
    if (!child) return null;
    current = child;
  }
  
  return current;
}

// Helper function to convert tree to flat structure for frontend
function convertToFileSystem(node, path = '', result = {}) {
  const currentPath = path || '';
  
  if (!result[currentPath]) {
    result[currentPath] = [];
  }
  
  if (node.children) {
    node.children.forEach(child => {
      result[currentPath].push({
        name: child.name,
        type: child.isDirectory ? 'directory' : 'file'
      });
      
      if (child.isDirectory) {
        const newPath = currentPath ? `${currentPath}/${child.name}` : child.name;
        convertToFileSystem(child, newPath, result);
      }
    });
  }
  
  return result;
}

// API Routes

// Get entire file system
app.get('/api/filesystem', (req, res) => {
  try {
    const fileSystem = convertToFileSystem(root);
    res.json({ success: true, data: fileSystem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get contents of a specific directory
app.get('/api/directory', (req, res) => {
  try {
    const path = req.query.path || '';
    const pathArray = path ? path.split('/') : [];
    
    const node = pathArray.length === 0 ? root : findNodeByPath(pathArray);
    
    if (!node) {
      return res.status(404).json({ success: false, error: 'Directory not found' });
    }
    
    if (!node.isDirectory) {
      return res.status(400).json({ success: false, error: 'Not a directory' });
    }
    
    const items = node.children.map(child => ({
      name: child.name,
      type: child.isDirectory ? 'directory' : 'file'
    }));
    
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add file or directory
app.post('/api/add', (req, res) => {
  try {
    const { path, name, type } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Name and type are required' });
    }
    
    const pathArray = path ? path.split('/') : [];
    const parentNode = pathArray.length === 0 ? root : findNodeByPath(pathArray);
    
    if (!parentNode) {
      return res.status(404).json({ success: false, error: 'Parent directory not found' });
    }
    
    if (!parentNode.isDirectory) {
      return res.status(400).json({ success: false, error: 'Parent is not a directory' });
    }
    
    // Check for duplicates
    if (parentNode.children.some(child => child.name === name)) {
      return res.status(409).json({ success: false, error: 'Item with this name already exists' });
    }
    
    const newNode = new FileNode(name, type === 'directory');
    parentNode.children.push(newNode);
    
    res.json({ 
      success: true, 
      message: `${type === 'directory' ? 'Directory' : 'File'} created successfully`,
      data: { name, type }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete file or directory
app.delete('/api/delete', (req, res) => {
  try {
    const { path, name } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    const pathArray = path ? path.split('/') : [];
    const parentNode = pathArray.length === 0 ? root : findNodeByPath(pathArray);
    
    if (!parentNode) {
      return res.status(404).json({ success: false, error: 'Parent directory not found' });
    }
    
    const itemIndex = parentNode.children.findIndex(child => child.name === name);
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    const deletedItem = parentNode.children[itemIndex];
    parentNode.children.splice(itemIndex, 1);
    
    res.json({ 
      success: true, 
      message: `${deletedItem.isDirectory ? 'Directory' : 'File'} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize with some sample data
function initializeSampleData() {
  const documents = new FileNode('Documents', true);
  const images = new FileNode('Images', true);
  const readme = new FileNode('readme.txt', false);
  
  root.children.push(documents, images, readme);
  
  const work = new FileNode('Work', true);
  const personal = new FileNode('Personal', true);
  const notes = new FileNode('notes.txt', false);
  
  documents.children.push(work, personal, notes);
  
  const vacation = new FileNode('Vacation', true);
  const photo1 = new FileNode('photo1.jpg', false);
  
  images.children.push(vacation, photo1);
}

// Initialize sample data on startup
initializeSampleData();

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📁 File Management System API is ready`);
});