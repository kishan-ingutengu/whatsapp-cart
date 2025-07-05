const catalog = require('./catalog.json');

function parseCartText(text) {
  const items = text.split(',').map((entry) => {
    const [id, qty] = entry.trim().split('x').map(Number);
    const item = catalog.find((c) => c.id === id);
    if (item) {
      return {
        name: item.name,
        price: item.price,
        quantity: qty,
        total: item.price * qty,
      };
    }
    return null;
  });

  const filtered = items.filter(Boolean);
  const total = filtered.reduce((sum, item) => sum + item.total, 0);
  return { items: filtered, total };
}

module.exports = { parseCartText };