
Built by https://www.blackbox.ai

---

# FLOORSTOCK

## Project Overview
FLOORSTOCK is a web application designed for offline inventory management. It provides functionalities to manage groups of items and the items within those groups. Users can search for items, add new groups, and add new items to existing groups, all in a user-friendly interface using Tailwind CSS.

## Installation
To set up the FLOORSTOCK application locally, follow these steps:

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/floorstock.git
   cd floorstock
   ```

2. Open the `index.html` file in your preferred web browser to run the application.

3. Make sure to replace `YOUR_DEPLOYED_WEB_APP_URL` in the script with the actual URL of your deployed backend service.

## Usage
1. Open the application in your web browser by loading the `index.html` file.
2. Use the provided search bar to look for items by name.
3. Select a group from the dropdown to categorize items.
4. Click on "Tambah Kelompok" to add new item groups.
5. Click on "Tambah Barang" to add new items to the selected group.
6. Use the tabs to switch between different views: Transaction and History.

## Features
- **Search Functionality:** Quickly search for items by name.
- **Dynamic Group Management:** Add new groups and items, updating the UI seamlessly.
- **Responsive Design:** Optimized for various screen sizes using Tailwind CSS.
- **User Feedback:** Alerts and messages inform users about successful operations and errors.

## Dependencies
This project uses the following dependencies:
- Tailwind CSS: For styling and responsive design.

## Project Structure
```
.
├── index.html
└── (optional: other files such as CSS/JS files can be added in the future)
```

## Future Improvements
- Implement a backend service for storing data persistently.
- Include user authentication.
- Enhance error handling and user feedback mechanisms.