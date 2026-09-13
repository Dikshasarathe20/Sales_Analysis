export type SalesRecord = {
  orderId: string;
  date: string;
  customer: string;
  city: string;
  state: string;
  region: string;
  product: string;
  category: string;
  quantity: number;
  sales: number;
  cost: number;
  discount: number;
  profit: number;
  paymentMode: string;
  salesperson: string;
};

type ProductDefinition = {
  name: string;
  category: string;
  price: number;
  costRate: number;
};

const locations = [
  { city: "Mumbai", state: "Maharashtra", region: "West" },
  { city: "Pune", state: "Maharashtra", region: "West" },
  { city: "Ahmedabad", state: "Gujarat", region: "West" },
  { city: "Jaipur", state: "Rajasthan", region: "North" },
  { city: "New Delhi", state: "Delhi", region: "North" },
  { city: "Lucknow", state: "Uttar Pradesh", region: "North" },
  { city: "Bengaluru", state: "Karnataka", region: "South" },
  { city: "Hyderabad", state: "Telangana", region: "South" },
  { city: "Chennai", state: "Tamil Nadu", region: "South" },
  { city: "Kolkata", state: "West Bengal", region: "East" },
  { city: "Bhubaneswar", state: "Odisha", region: "East" },
  { city: "Guwahati", state: "Assam", region: "East" },
];

const products: ProductDefinition[] = [
  { name: "Wireless Earbuds Pro", category: "Electronics", price: 2499, costRate: 0.63 },
  { name: "Smart LED TV 43\"", category: "Electronics", price: 32999, costRate: 0.72 },
  { name: "Power Bank 20,000mAh", category: "Electronics", price: 1599, costRate: 0.58 },
  { name: "Bluetooth Speaker", category: "Electronics", price: 2999, costRate: 0.61 },
  { name: "Cotton Kurta Set", category: "Fashion", price: 1899, costRate: 0.46 },
  { name: "Running Shoes", category: "Fashion", price: 3299, costRate: 0.51 },
  { name: "Linen Saree", category: "Fashion", price: 2799, costRate: 0.43 },
  { name: "Travel Backpack", category: "Fashion", price: 2299, costRate: 0.49 },
  { name: "Air Fryer 4L", category: "Home & Kitchen", price: 5999, costRate: 0.64 },
  { name: "Stainless Steel Cookware", category: "Home & Kitchen", price: 4299, costRate: 0.55 },
  { name: "Bamboo Storage Set", category: "Home & Kitchen", price: 1399, costRate: 0.44 },
  { name: "Organic Green Tea", category: "Groceries", price: 499, costRate: 0.52 },
  { name: "Premium Basmati Rice", category: "Groceries", price: 1199, costRate: 0.69 },
  { name: "Dry Fruit Gift Box", category: "Groceries", price: 1799, costRate: 0.67 },
  { name: "Herbal Face Serum", category: "Beauty", price: 899, costRate: 0.39 },
  { name: "Sandalwood Body Wash", category: "Beauty", price: 649, costRate: 0.36 },
  { name: "Vitamin C Skincare Kit", category: "Beauty", price: 1499, costRate: 0.45 },
];

const firstNames = [
  "Aarav", "Aanya", "Aditya", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya",
  "Meera", "Nikhil", "Priya", "Rahul", "Riya", "Saanvi", "Siddharth", "Tanya",
];
const lastNames = [
  "Sharma", "Patel", "Mehta", "Verma", "Iyer", "Kapoor", "Nair", "Reddy",
  "Banerjee", "Joshi", "Malhotra", "Chopra", "Bose", "Kulkarni", "Singh",
];
const salespeople = ["Anika Rao", "Dev Malhotra", "Ira Shah", "Kabir Nair", "Maya Iyer", "Rohan Desai"];
const paymentModes = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Cash on Delivery"];

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function generateDataset(count = 720, seed = 17): SalesRecord[] {
  const random = seededRandom(seed);
  const start = new Date("2025-04-01T00:00:00");
  const end = new Date("2026-03-31T00:00:00");
  const daySpan = Math.floor((end.getTime() - start.getTime()) / 86400000);

  return Array.from({ length: count }, (_, index) => {
    const location = locations[Math.floor(random() * locations.length)];
    const product = products[Math.floor(random() * products.length)];
    const quantity = 1 + Math.floor(random() * 5);
    const discount = Number((0.02 + random() * 0.18).toFixed(2));
    const unitPrice = product.price * (0.93 + random() * 0.14);
    const sales = Math.round(unitPrice * quantity * (1 - discount));
    const cost = Math.round(unitPrice * product.costRate * quantity);
    const date = new Date(start.getTime() + Math.floor(random() * daySpan) * 86400000);

    return {
      orderId: `ORD-${String(index + 1).padStart(5, "0")}`,
      date: toDateString(date),
      customer: `${firstNames[Math.floor(random() * firstNames.length)]} ${lastNames[Math.floor(random() * lastNames.length)]}`,
      city: location.city,
      state: location.state,
      region: location.region,
      product: product.name,
      category: product.category,
      quantity,
      sales,
      cost,
      discount,
      profit: sales - cost,
      paymentMode: paymentModes[Math.floor(random() * paymentModes.length)],
      salesperson: salespeople[Math.floor(random() * salespeople.length)],
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

function numberValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/[₹,%\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizedKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function normalizeCsvRows(rows: Record<string, unknown>[]): SalesRecord[] {
  const get = (row: Record<string, unknown>, keys: string[]) => {
    const keyMap = Object.keys(row).reduce<Record<string, unknown>>((map, key) => {
      map[normalizedKey(key)] = row[key];
      return map;
    }, {});
    const matchingKey = keys.map(normalizedKey).find((key) => key in keyMap);
    return matchingKey ? keyMap[matchingKey] : "";
  };

  return rows.map((row, index) => {
    const sales = numberValue(get(row, ["Sales", "Revenue", "Amount"]));
    const cost = numberValue(get(row, ["Cost", "COGS"]));
    const profitRaw = get(row, ["Profit", "Margin"]);
    const profit = profitRaw === "" ? sales - cost : numberValue(profitRaw);
    const dateRaw = String(get(row, ["Date", "Order Date"]) || "");
    const date = dateRaw ? new Date(dateRaw).toISOString().slice(0, 10) : "2025-04-01";

    return {
      orderId: String(get(row, ["Order ID", "OrderId", "ID"]) || `CSV-${String(index + 1).padStart(5, "0")}`),
      date,
      customer: String(get(row, ["Customer", "Customer Name"]) || "Unknown customer"),
      city: String(get(row, ["City"]) || "Unknown"),
      state: String(get(row, ["State"]) || "Unknown"),
      region: String(get(row, ["Region", "Zone"]) || "Unknown"),
      product: String(get(row, ["Product", "Product Name"]) || "Unknown product"),
      category: String(get(row, ["Category"]) || "Uncategorized"),
      quantity: numberValue(get(row, ["Quantity", "Qty"])) || 1,
      sales,
      cost,
      discount: numberValue(get(row, ["Discount"])) / (String(get(row, ["Discount"]) || "").includes("%") ? 100 : 1),
      profit,
      paymentMode: String(get(row, ["Payment Mode", "Payment", "Payment Type"]) || "Unknown"),
      salesperson: String(get(row, ["Salesperson", "Sales Person", "Agent"]) || "Unassigned"),
    };
  }).filter((row) => row.sales > 0 || row.product !== "Unknown product");
}

export const DEFAULT_CSV_COLUMNS = [
  "Order ID", "Date", "Customer", "City", "State", "Region", "Product",
  "Category", "Quantity", "Sales", "Cost", "Discount", "Profit", "Payment Mode", "Salesperson",
];
