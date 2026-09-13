# Ledgerline Sales Analysis Dashboard

A responsive Indian retail sales analytics dashboard built with React, TypeScript, Vite, Chart.js, and PapaParse. It generates a realistic 720-order dataset in the browser and lets you replace it with your own CSV.

## Features

- KPI cards for Total Sales, Profit, Orders, Quantity, Average Order Value, and Profit Margin
- Interactive Date, State, City, Category, Product, and Region filters
- Chart.js charts for monthly sales, category performance, region/city sales, top 10 products, and payment modes
- Dynamic business insights based on the active filtered view
- Searchable, sortable, paginated sales table
- CSV upload with flexible column-name normalization
- CSV download for every chart and the transaction view
- Dark/light mode, reset filters, refresh data, and print/PDF support
- Responsive desktop and mobile layouts

## Run in VS Code

1. Clone the repository:

   git clone https://github.com/Dikshasarathe20/Sales_Analysis.git
   cd Sales_Analysis

2. Install dependencies:

   npm install

3. Start the development server:

   npm run dev

The app will be available at the local Vite URL shown in the terminal.

## CSV format

The upload parser accepts columns such as Order ID, Date, Customer, City, State, Region, Product, Category, Quantity, Sales, Cost, Discount, Profit, Payment Mode, and Salesperson.
