export function formatCurrency(amount, currency = '₹') {
  if (amount == null || isNaN(amount)) return `${currency}0`;
  const num = Number(amount);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${currency}${formatted}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthLabel(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getMonthOptions(count = 12) {
  const options = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

export function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
