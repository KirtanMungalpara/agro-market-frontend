import React, { useState } from 'react';

const Sidebar = ({ items, active, setActive }) => {
  const [open, setOpen] = useState(false);

  const activeLabel = items.find((it) => it.id === active)?.label || 'Menu';

  const handleSelect = (id) => {
    setActive(id);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button — shown only on mobile */}
      <button className="sidebar-toggle-btn" onClick={() => setOpen(true)}>
        ☰ &nbsp; {activeLabel}
      </button>

      {/* Overlay — shown when sidebar is open on mobile */}
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar panel */}
      <div className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        {/* Close button inside sidebar (mobile) */}
        <button
          className="sidebar-close-btn"
          onClick={() => setOpen(false)}
        >
          ✕ Close
        </button>

        {items.map((it) => (
          <button
            key={it.id}
            className={`sidebar-item ${active === it.id ? 'active' : ''}`}
            onClick={() => handleSelect(it.id)}
          >
            {it.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
