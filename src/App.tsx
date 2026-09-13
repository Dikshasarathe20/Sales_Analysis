import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend as ChartLegend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import Papa from "papaparse";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Filter,
  LayoutDashboard,
  ListFilter,
  Menu,
  Moon,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Sun,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { generateDataset, normalizeCsvRows, type SalesRecord } from "@/lib/data";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  ChartLegend,
  ChartTooltip,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
);

const chartColors = ["#d87947", "#2f7e78", "#d1a24c", "#765a9d", "#c25e72", "#4b91b5"];
const formatCurrency = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const percent = (value: number) => `${value.toFixed(1)}%`;

type Filters = {
  startDate: string;
  endDate: string;
  state: string;
  city: string;
  category: string;
  product: string;
  region: string;
};

const initialFilters: Filters = {
  startDate: "",
  endDate: "",
  state: "All states",
  city: "All cities",
  category: "All categories",
  product: "All products",
  region: "All regions",
};

function uniqueValues(rows: SalesRecord[], key: keyof SalesRecord) {
  return [...new Set(rows.map((row) => String(row[key])))].sort((a, b) => a.localeCompare(b));
}

function aggregate(rows: SalesRecord[], key: keyof SalesRecord) {
  const map = new Map<string, { sales: number; profit: number; quantity: number; orders: number }>();
  rows.forEach((row) => {
    const name = String(row[key]);
    const current = map.get(name) ?? { sales: 0, profit: 0, quantity: 0, orders: 0 };
    current.sales += row.sales;
    current.profit += row.profit;
    current.quantity += row.quantity;
    current.orders += 1;
    map.set(name, current);
  });
  return [...map.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.sales - a.sales);
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ChartExport({ filename, rows }: { filename: string; rows: Array<Record<string, unknown>> }) {
  return (
    <button className="chart-action" onClick={() => downloadCsv(filename, rows)} title="Download chart data">
      <Download size={14} />
      CSV
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <span className="select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown size={15} />
      </span>
    </label>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  note,
  accent,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
  note: string;
  accent: string;
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-icon" style={{ color: accent, background: `${accent}18` }}>
        <Icon size={19} />
      </div>
      <div className="kpi-content">
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
    </article>
  );
}

function ChartCard({
  title,
  description,
  children,
  exportRows,
  exportName,
  className = "",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  exportRows: Array<Record<string, unknown>>;
  exportName: string;
  className?: string;
}) {
  return (
    <section className={`chart-card ${className}`}>
      <div className="card-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <ChartExport filename={exportName} rows={exportRows} />
      </div>
      {children}
    </section>
  );
}

function App() {
  const [rows, setRows] = useState<SalesRecord[]>(() => generateDataset());
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof SalesRecord>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [uploadMessage, setUploadMessage] = useState("");
  const [autoRefresh, setAutoRefresh] = useState("Off");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    if (filters.startDate && row.date < filters.startDate) return false;
    if (filters.endDate && row.date > filters.endDate) return false;
    if (filters.state !== "All states" && row.state !== filters.state) return false;
    if (filters.city !== "All cities" && row.city !== filters.city) return false;
    if (filters.category !== "All categories" && row.category !== filters.category) return false;
    if (filters.product !== "All products" && row.product !== filters.product) return false;
    if (filters.region !== "All regions" && row.region !== filters.region) return false;
    return true;
  }), [filters, rows]);

  const metrics = useMemo(() => {
    const sales = filteredRows.reduce((sum, row) => sum + row.sales, 0);
    const profit = filteredRows.reduce((sum, row) => sum + row.profit, 0);
    const quantity = filteredRows.reduce((sum, row) => sum + row.quantity, 0);
    return {
      sales,
      profit,
      orders: filteredRows.length,
      quantity,
      aov: filteredRows.length ? sales / filteredRows.length : 0,
      margin: sales ? (profit / sales) * 100 : 0,
    };
  }, [filteredRows]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { sales: number; profit: number }>();
    filteredRows.forEach((row) => {
      const month = row.date.slice(0, 7);
      const current = map.get(month) ?? { sales: 0, profit: 0 };
      current.sales += row.sales;
      current.profit += row.profit;
      map.set(month, current);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({
      month: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      ...value,
    }));
  }, [filteredRows]);

  const categoryData = useMemo(() => aggregate(filteredRows, "category"), [filteredRows]);
  const regionData = useMemo(() => aggregate(filteredRows, "region"), [filteredRows]);
  const cityData = useMemo(() => aggregate(filteredRows, "city").slice(0, 8), [filteredRows]);
  const productData = useMemo(() => aggregate(filteredRows, "product").slice(0, 10), [filteredRows]);
  const paymentData = useMemo(() => aggregate(filteredRows, "paymentMode"), [filteredRows]);

  const tableRows = useMemo(() => {
    const query = search.toLowerCase();
    return filteredRows
      .filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(query)))
      .sort((a, b) => {
        const left = a[sortKey];
        const right = b[sortKey];
        const comparison = typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [filteredRows, search, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const visibleRows = tableRows.slice((page - 1) * pageSize, page * pageSize);

  const options = {
    states: ["All states", ...uniqueValues(rows, "state")],
    cities: ["All cities", ...uniqueValues(rows, "city")],
    categories: ["All categories", ...uniqueValues(rows, "category")],
    products: ["All products", ...uniqueValues(rows, "product")],
    regions: ["All regions", ...uniqueValues(rows, "region")],
  };

  const topCategory = categoryData[0]?.name ?? "—";
  const topRegion = regionData[0]?.name ?? "—";
  const topProduct = productData[0]?.name ?? "—";
  const bestMonth = monthlyData.reduce((best, month) => month.sales > (best?.sales ?? 0) ? month : best, monthlyData[0]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearch("");
    setPage(1);
  };

  const regenerate = () => {
    setRows(generateDataset(720, Math.floor(Math.random() * 5000)));
    resetFilters();
    setUploadMessage("Demo dataset refreshed with 720 retail orders.");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        const normalized = normalizeCsvRows(result.data);
        if (!normalized.length) {
          setUploadMessage("No usable records found in that file.");
          return;
        }
        setRows(normalized);
        resetFilters();
        setUploadMessage(`${normalized.length.toLocaleString("en-IN")} records loaded from ${file.name}.`);
      },
      error: (error) => setUploadMessage(`CSV error: ${error.message}`),
    });
    event.target.value = "";
  };

  const handleSort = (key: keyof SalesRecord) => {
    if (sortKey === key) setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const chartGrid = darkMode ? "rgba(255,255,255,0.08)" : "rgba(27,39,55,0.09)";
  const chartTick = darkMode ? "#9aa4b2" : "#677486";
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartTick, font: { family: "DM Sans", size: 11 } } },
      y: { grid: { color: chartGrid }, ticks: { color: chartTick, font: { family: "DM Sans", size: 11 } } },
    },
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><BarChart3 size={20} /></div>
          <div>
            <strong>Ledgerline</strong>
            <span>Retail intelligence</span>
          </div>
          <button className="sidebar-close mobile-only" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav">
          <a className="active" href="#overview"><LayoutDashboard size={18} /> Overview</a>
          <a href="#transactions"><ShoppingBag size={18} /> Transactions <span className="nav-count">{rows.length}</span></a>
          <a href="#insights"><TrendingUp size={18} /> Insights</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="data-source-card">
            <div className="source-icon"><FileSpreadsheet size={18} /></div>
            <div>
              <strong>{rows.length.toLocaleString("en-IN")} rows</strong>
              <span>{uploadMessage ? "Custom CSV" : "Demo retail dataset"}</span>
            </div>
            <button onClick={() => fileInput.current?.click()} title="Upload a CSV"><Upload size={16} /></button>
          </div>
          <div className="sidebar-footer">
            <span className="status-dot" /> Data synced just now
          </div>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-backdrop mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu mobile-only" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div>
            <p className="eyebrow">BUSINESS OVERVIEW</p>
            <h1>Sales performance</h1>
          </div>
          <div className="topbar-actions">
            <div className="date-status"><CalendarDays size={16} /><span>Apr 2025 — Mar 2026</span></div>
            <button className="icon-button" onClick={() => setDarkMode((value) => !value)} title="Toggle color mode">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="primary-button" onClick={() => fileInput.current?.click()}><CloudUpload size={17} /> Upload CSV</button>
          </div>
        </header>

        <div className="page-content" id="overview">
          <section className="hero-row">
            <div>
              <h2>Good morning, here's your pulse.</h2>
              <p>Monitor revenue quality and spot the next growth opportunity across your retail network.</p>
            </div>
            <div className="hero-actions">
              <button className="secondary-button" onClick={resetFilters}><RotateCcw size={15} /> Reset filters</button>
              <div className="refresh-group">
                <button className="secondary-button refresh-main" onClick={regenerate}><RefreshCw size={15} /> Refresh</button>
                <select value={autoRefresh} onChange={(event) => setAutoRefresh(event.target.value)} aria-label="Auto refresh interval">
                  <option>Off</option><option>5 min</option><option>15 min</option><option>30 min</option>
                </select>
              </div>
              <button className="icon-button" onClick={() => window.print()} title="Print or save as PDF"><Download size={17} /></button>
            </div>
          </section>

          <section className="filter-bar">
            <div className="filter-title"><Filter size={17} /><strong>Filters</strong><span>{filteredRows.length.toLocaleString("en-IN")} matching orders</span></div>
            <div className="date-filter">
              <input type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} />
              <span>to</span>
              <input type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} />
            </div>
            <SelectField label="" value={filters.region} options={options.regions} onChange={(value) => updateFilter("region", value)} />
            <SelectField label="" value={filters.state} options={options.states} onChange={(value) => updateFilter("state", value)} />
            <SelectField label="" value={filters.city} options={options.cities} onChange={(value) => updateFilter("city", value)} />
            <SelectField label="" value={filters.category} options={options.categories} onChange={(value) => updateFilter("category", value)} />
            <SelectField label="" value={filters.product} options={options.products} onChange={(value) => updateFilter("product", value)} />
          </section>

          {uploadMessage && (
            <div className="notice"><FileSpreadsheet size={16} /><span>{uploadMessage}</span><button onClick={() => setUploadMessage("")}><X size={15} /></button></div>
          )}

          <section className="kpi-grid">
            <KpiCard icon={CircleDollarSign} label="Total sales" value={formatCurrency(metrics.sales)} note="Gross revenue after discounts" accent="#d87947" />
            <KpiCard icon={TrendingUp} label="Profit" value={formatCurrency(metrics.profit)} note={`${percent(metrics.margin)} margin`} accent="#2f7e78" />
            <KpiCard icon={ShoppingBag} label="Orders" value={metrics.orders.toLocaleString("en-IN")} note="Completed orders" accent="#765a9d" />
            <KpiCard icon={Package} label="Quantity sold" value={metrics.quantity.toLocaleString("en-IN")} note="Units across all orders" accent="#d1a24c" />
            <KpiCard icon={CircleDollarSign} label="Average order value" value={formatCurrency(metrics.aov)} note="Sales per order" accent="#c25e72" />
            <KpiCard icon={TrendingUp} label="Profit margin" value={percent(metrics.margin)} note="Profit as % of sales" accent="#4b91b5" />
          </section>

          <section className="chart-grid">
            <ChartCard
              title="Monthly sales trend"
              description="Revenue and profit movement over time"
              className="span-two"
              exportName="monthly-sales-trend.csv"
              exportRows={monthlyData}
            >
              <div className="chart-wrap trend-chart">
                <Line
                  data={{
                    labels: monthlyData.map((item) => item.month),
                    datasets: [
                      { label: "Sales", data: monthlyData.map((item) => item.sales), borderColor: chartColors[0], backgroundColor: "rgba(216,121,71,.14)", fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: chartColors[0] },
                      { label: "Profit", data: monthlyData.map((item) => item.profit), borderColor: chartColors[1], backgroundColor: "transparent", fill: false, tension: 0.35, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: chartColors[1] },
                    ],
                  }}
                  options={{ ...baseOptions, plugins: { legend: { display: true, position: "bottom", labels: { color: chartTick, usePointStyle: true, padding: 18 } }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(Number(context.raw))}` } } }, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, ticks: { ...baseOptions.scales.y.ticks, callback: (value) => `₹${formatCompact(Number(value))}` } } } }}
                />
              </div>
            </ChartCard>
            <ChartCard
              title="Payment mode analysis"
              description="How customers are choosing to pay"
              exportName="payment-mode-analysis.csv"
              exportRows={paymentData}
            >
              <div className="chart-wrap doughnut-chart">
                <Doughnut
                  data={{ labels: paymentData.map((item) => item.name), datasets: [{ data: paymentData.map((item) => item.sales), backgroundColor: chartColors, borderWidth: 0, hoverOffset: 5 }] }}
                  options={{ responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { position: "right", labels: { color: chartTick, usePointStyle: true, padding: 14, boxWidth: 8 } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(Number(context.raw))}` } } } }}
                />
                <div className="donut-center"><strong>{formatCompact(metrics.sales)}</strong><span>total sales</span></div>
              </div>
            </ChartCard>

            <ChartCard
              title="Sales & profit by category"
              description="Category contribution to the bottom line"
              exportName="category-performance.csv"
              exportRows={categoryData}
            >
              <div className="chart-wrap bar-chart">
                <Bar data={{ labels: categoryData.map((item) => item.name), datasets: [{ label: "Sales", data: categoryData.map((item) => item.sales), backgroundColor: chartColors[0], borderRadius: 5, barPercentage: 0.62 }, { label: "Profit", data: categoryData.map((item) => item.profit), backgroundColor: chartColors[1], borderRadius: 5, barPercentage: 0.62 }] }} options={{ ...baseOptions, plugins: { legend: { display: true, position: "bottom", labels: { color: chartTick, usePointStyle: true, padding: 16 } }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(Number(context.raw))}` } } }, scales: { ...baseOptions.scales, x: { ...baseOptions.scales.x, ticks: { ...baseOptions.scales.x.ticks, maxRotation: 0 } }, y: { ...baseOptions.scales.y, ticks: { ...baseOptions.scales.y.ticks, callback: (value) => `₹${formatCompact(Number(value))}` } } } }} />
              </div>
            </ChartCard>
            <ChartCard
              title="Region & city-wise sales"
              description="Revenue concentration across locations"
              exportName="region-city-sales.csv"
              exportRows={cityData}
            >
              <div className="chart-wrap bar-chart">
                <Bar data={{ labels: cityData.map((item) => item.name), datasets: [{ label: "Sales", data: cityData.map((item) => item.sales), backgroundColor: cityData.map((_, index) => chartColors[index % chartColors.length]), borderRadius: 5, barPercentage: 0.6 }] }} options={{ ...baseOptions, indexAxis: "y", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => formatCurrency(Number(context.raw)) } } }, scales: { x: { ...baseOptions.scales.y, ticks: { ...baseOptions.scales.y.ticks, callback: (value) => `₹${formatCompact(Number(value))}` } }, y: { ...baseOptions.scales.x, grid: { display: false } } } }} />
              </div>
            </ChartCard>
            <ChartCard
              title="Top 10 products"
              description="Best-selling products by revenue"
              exportName="top-products.csv"
              exportRows={productData}
              className="span-two"
            >
              <div className="chart-wrap bar-chart products-chart">
                <Bar data={{ labels: productData.map((item) => item.name), datasets: [{ label: "Sales", data: productData.map((item) => item.sales), backgroundColor: productData.map((_, index) => chartColors[index % chartColors.length]), borderRadius: 5, barPercentage: 0.58 }] }} options={{ ...baseOptions, indexAxis: "y", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => formatCurrency(Number(context.raw)) } } }, scales: { x: { ...baseOptions.scales.y, ticks: { ...baseOptions.scales.y.ticks, callback: (value) => `₹${formatCompact(Number(value))}` } }, y: { ...baseOptions.scales.x, grid: { display: false }, ticks: { ...baseOptions.scales.x.ticks, autoSkip: false } } } }} />
              </div>
            </ChartCard>
          </section>

          <section className="insights-section" id="insights">
            <div className="section-heading"><div><p className="eyebrow">SMART READOUT</p><h2>What the data is saying</h2></div><span>Based on {filteredRows.length.toLocaleString("en-IN")} matching orders</span></div>
            <div className="insight-grid">
              <div className="insight-card"><span className="insight-number">01</span><div><strong>{topCategory} leads the mix</strong><p>{topCategory} is the strongest category by sales, contributing {percent(metrics.sales ? ((categoryData[0]?.sales ?? 0) / metrics.sales) * 100 : 0)} of the current view.</p></div></div>
              <div className="insight-card"><span className="insight-number">02</span><div><strong>{topRegion} is your growth engine</strong><p>The {topRegion} region has the highest sales concentration. {cityData[0]?.name ?? "Your leading city"} is the strongest city in the current selection.</p></div></div>
              <div className="insight-card"><span className="insight-number">03</span><div><strong>{bestMonth?.month ?? "This period"} is the peak month</strong><p>Sales reached {formatCurrency(bestMonth?.sales ?? 0)} at the period high, while the overall profit margin is {percent(metrics.margin)}.</p></div></div>
              <div className="insight-card"><span className="insight-number">04</span><div><strong>Focus on {topProduct}</strong><p>{topProduct} is the top product by revenue. Keep inventory and promotional coverage ready for this demand leader.</p></div></div>
            </div>
          </section>

          <section className="table-section" id="transactions">
            <div className="section-heading table-heading"><div><p className="eyebrow">ORDER LEDGER</p><h2>Sales transactions</h2><span>Search, sort, and review every order in the current view</span></div><button className="secondary-button" onClick={() => downloadCsv("sales-transactions.csv", tableRows)}><Download size={15} /> Export view</button></div>
            <div className="table-toolbar">
              <div className="search-field"><Search size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search orders, products, customers..." /></div>
              <div className="table-meta"><ListFilter size={16} /> {tableRows.length.toLocaleString("en-IN")} rows <span>•</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={8}>8 / page</option><option value={12}>12 / page</option><option value={20}>20 / page</option></select></div>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr>
                  {[
                    ["orderId", "Order ID"], ["date", "Date"], ["customer", "Customer"], ["city", "City"], ["product", "Product"], ["category", "Category"], ["sales", "Sales"], ["profit", "Profit"], ["paymentMode", "Payment"], ["salesperson", "Salesperson"],
                  ].map(([key, label]) => <th key={key} onClick={() => handleSort(key as keyof SalesRecord)}>{label}<span className={sortKey === key ? "sort-active" : ""}>{sortKey === key ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></th>)}
                </tr></thead>
                <tbody>
                  {visibleRows.map((row) => <tr key={row.orderId}>
                    <td className="order-id">{row.orderId}</td><td>{new Date(`${row.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td className="customer-cell">{row.customer}</td><td>{row.city}</td><td className="product-cell">{row.product}</td><td><span className="category-pill">{row.category}</span></td><td className="money-cell">{formatCurrency(row.sales)}</td><td className="profit-cell">{formatCurrency(row.profit)}</td><td>{row.paymentMode}</td><td>{row.salesperson}</td>
                  </tr>)}
                  {!visibleRows.length && <tr><td colSpan={10} className="empty-table">No orders match these filters. Try resetting your filters.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="pagination"><span>Showing {tableRows.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, tableRows.length)} of {tableRows.length.toLocaleString("en-IN")}</span><div><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /> Previous</button><span className="page-number">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={16} /></button></div></div>
          </section>
        </div>
        <input ref={fileInput} className="hidden-file-input" type="file" accept=".csv,text/csv" onChange={handleFileUpload} />
        <footer className="app-footer"><span>Ledgerline Sales Intelligence</span><span>Built for retail decisions · Dataset updates live with every filter</span></footer>
      </main>
    </div>
  );
}

export default App;
