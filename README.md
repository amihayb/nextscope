# Nextscope - Blau Robotics

**Nextscope** is an interactive telemetry analysis tool for loading, visualizing, and inspecting recorded NextPower system data.
Developed by Blau Robotics, it runs entirely in the browser with no installation required.
We build reliable tools for advanced control systems — because at Blau Robotics, **we do it best.**

## Features

### 🔧 Core Functionality
- **CSV/Text Import**: Load recorded NextPower telemetry from CSV or text files
- **Signal Selection**: Choose signals for upper or lower plot windows
- **X-Axis Control**: Switch the x-axis to any signal
- **Transforms & Ops**: Apply rename, multiply, diff, integrate, filter, detrend
- **Stats & Tips**: View statistics in a zoomed range and add data tips

### 🎨 User Interface
- **Top Navigation**: Quick access to core actions
- **Resizable Sidebar**: Drag to resize the signal list area
- **Drag & Drop**: Drop a file directly to load it
- **Context Menu**: Right-click signals to apply operations

### 📊 Data Handling
- **Plotly Charts**: Interactive, zoomable plots
- **Two-Panel Layout**: Separate upper and lower scopes
- **Example Data**: One-click sample dataset to get started

## Browser Requirements

This app runs in modern browsers that support standard HTML/JS features:

- ✅ **Chrome**
- ✅ **Edge**
- ✅ **Firefox**
- ✅ **Safari**

## Setup and Usage

### 1. Open the Application
1. Download or clone this repository
2. Open `index.html` in your browser

### 2. Load Data
1. Click the folder icon in the top bar, or drag and drop a file
2. Select signals from the sidebar checkboxes
3. Pick the x-axis from the dropdown

### 3. Explore and Analyze
- Right-click a signal for transforms
- Zoom the plot and use Statistics
- Add Data Tips for point annotations

## File Structure
```
Nextscope/
├── index.html          # Main HTML structure
├── StyleSheet.css      # CSS styling
├── js/                 # Application logic
└── README.md           # This documentation
```

## Contact

Amihay Blau  
mail: amihay@blaurobotics.co.il  
Phone: +972-54-6668902  
