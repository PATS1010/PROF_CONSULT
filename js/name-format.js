// Keep existing full names intact while adding missing middle-initial periods.
window.ProfConsultNames = {
  format(name) {
    const parts = String(name || "").trim().split(/\s+/);
    return parts.map((part, index) => {
      if (index > 0 && index < parts.length - 1 && /^\p{L}$/u.test(part)) {
        return `${part.toUpperCase()}.`;
      }
      return part;
    }).join(" ");
  },
};
