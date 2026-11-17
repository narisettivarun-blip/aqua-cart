/* Aqua Cart - Admin panel logic */

let currentTab = 'pending';

async function api(url, opts = {}) {
  opts.headers = opts.headers || {};
  if (!(opts.body instanceof FormData) && opts.body) opts.headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { credentials: 'same-origin', ...opts });
  let data = {};
  try { data = await res.json(); } catch (e) {}
  return { status: res.status, ok: res.ok, data };
}

function showMsg(id, text) {
  const el = document.getElementById(id);
  if (!text) { el.style.display = 'none'; return; }
  el.innerText = text; el.style.display = 'block';
}

async function adminLogin() {
  showMsg('adminLoginError', null);
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const { ok, data } = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!ok) { showMsg('adminLoginError', data.error || 'Login failed.'); return; }
  enterDashboard(data.user);
}

async function adminLogout() {
  await api('/api/logout', { method: 'POST' });
  location.reload();
}

function enterDashboard(user) {
  document.getElementById('adminLoginWrap').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';
  document.getElementById('adminNameLabel').innerText = `${user.name} (${user.email})`;
  loadStats();
  switchTab('pending');
}

async function loadStats() {
  const { ok, data } = await api('/api/admin/stats');
  if (!ok) return;
  const s = data.stats;
  document.getElementById('statGrid').innerHTML = `
    <div class="stat-card"><div class="num">${s.pendingUsers}</div><div class="lbl">Pending Users</div></div>
    <div class="stat-card"><div class="num">${s.approvedUsers}</div><div class="lbl">Approved Users</div></div>
    <div class="stat-card"><div class="num">${s.rejectedUsers}</div><div class="lbl">Rejected Users</div></div>
    <div class="stat-card"><div class="num">${s.totalListings}</div><div class="lbl">Total Listings</div></div>
    <div class="stat-card"><div class="num">${s.availableListings}</div><div class="lbl">Available</div></div>
    <div class="stat-card"><div class="num">${s.soldListings}</div><div class="lbl">Sold</div></div>
  `;
}

function switchTab(tab) {
  currentTab = tab;
  ['tabPending', 'tabApproved', 'tabRejected', 'tabListings', 'tabPrices'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');

  if (tab === 'listings') loadListings();
  else if (tab === 'prices') loadPrices();
  else loadUsers(tab);
}

async function loadUsers(status) {
  const { ok, data } = await api(`/api/admin/users?status=${status}`);
  const container = document.getElementById('tabContent');
  if (!ok) { container.innerHTML = '<p>Could not load users.</p>'; return; }

  if (data.users.length === 0) {
    container.innerHTML = `<p>No ${status} users.</p>`;
    return;
  }

  container.innerHTML = data.users.map(u => `
    <div class="user-row">
      <div class="info">
        <b>${u.name}</b><br>
        📞 ${u.phone} &nbsp;|&nbsp; ✉️ ${u.email}
      </div>
      <div class="action-group" style="margin-top:0;">
        ${status !== 'approved' ? `<button class="btn-action btn-approve" onclick="approveUser(${u.id})">Approve</button>` : ''}
        ${status !== 'rejected' ? `<button class="btn-action btn-reject" onclick="rejectUser(${u.id})">Reject</button>` : ''}
        <button class="btn-action btn-delete" onclick="deleteUser(${u.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

async function approveUser(id) {
  await api(`/api/admin/users/${id}/approve`, { method: 'POST' });
  loadStats(); loadUsers(currentTab);
}
async function rejectUser(id) {
  await api(`/api/admin/users/${id}/reject`, { method: 'POST' });
  loadStats(); loadUsers(currentTab);
}
async function deleteUser(id) {
  if (!confirm('Permanently delete this user account?')) return;
  await api(`/api/admin/users/${id}`, { method: 'DELETE' });
  loadStats(); loadUsers(currentTab);
}

async function loadListings() {
  const { ok, data } = await api('/api/admin/listings');
  const container = document.getElementById('tabContent');
  if (!ok) { container.innerHTML = '<p>Could not load listings.</p>'; return; }

  if (data.listings.length === 0) { container.innerHTML = '<p>No listings yet.</p>'; return; }

  container.innerHTML = data.listings.map(l => `
    <div class="user-row">
      <div class="info">
        <b>${l.type}</b> — ₹${Number(l.price).toLocaleString('en-IN')} — <i>${l.status}</i><br>
        Seller: ${l.sellerName} (${l.sellerPhone})<br>
        📍 ${esc(l.address)}${l.note ? `<br>📝 ${esc(l.note)}` : ''}
      </div>
      <div class="action-group" style="margin-top:0;">
        <button class="btn-action btn-delete" onclick="deleteListing(${l.id})">Remove Listing</button>
      </div>
    </div>
  `).join('');
}

async function deleteListing(id) {
  if (!confirm('Remove this listing?')) return;
  await api(`/api/admin/listings/${id}`, { method: 'DELETE' });
  loadStats(); loadListings();
}

/* ---------------- market prices (admin only) ---------------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadPrices() {
  const container = document.getElementById('tabContent');
  const { ok, data } = await api('/api/market-prices');
  if (!ok) { container.innerHTML = '<p>Could not load market prices.</p>'; return; }

  const rows = data.prices.map(p => `
    <div class="user-row">
      <div class="info"><b>${esc(p.fishName)}</b><br><small>Last updated: ${esc(p.updatedAt)}</small></div>
      <div class="action-group" style="margin-top:0; display:flex; gap:8px; align-items:center;">
        <span>₹</span>
        <input type="number" min="0" step="any" class="price-input" id="price_${p.id}" value="${p.pricePerKg}">
        <span>/kg</span>
        <button class="btn-action btn-approve" onclick="savePrice(${p.id})">Save</button>
        <button class="btn-action btn-delete" onclick="deletePrice(${p.id}, '${esc(p.fishName).replace(/'/g, "\\'")}')">Delete</button>
      </div>
    </div>`).join('');

  container.innerHTML = `
    <div class="msg-box msg-error" id="priceError"></div>
    <div class="msg-box msg-success" id="priceSuccess"></div>
    <div class="user-row">
      <div class="info"><b>Add a new fish price</b></div>
      <div class="action-group" style="margin-top:0; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <input type="text" class="price-input" style="width:180px;" id="newFishName" placeholder="Fish name">
        <span>₹</span>
        <input type="number" min="0" step="any" class="price-input" id="newFishPrice" placeholder="Price / kg">
        <button class="btn-action btn-approve" onclick="addPrice()">Add</button>
      </div>
    </div>
    ${rows || '<p>No market prices yet. Add one above.</p>'}`;
}

function flashPriceMsg(id, text) {
  showMsg('priceError', null); showMsg('priceSuccess', null);
  showMsg(id, text);
  setTimeout(() => showMsg(id, null), 3000);
}

async function savePrice(id) {
  const value = document.getElementById('price_' + id).value;
  const { ok, data } = await api(`/api/admin/market-prices/${id}`, { method: 'PUT', body: JSON.stringify({ pricePerKg: value }) });
  flashPriceMsg(ok ? 'priceSuccess' : 'priceError', ok ? 'Price updated.' : (data.error || 'Could not update price.'));
}

async function addPrice() {
  const fishName = document.getElementById('newFishName').value.trim();
  const pricePerKg = document.getElementById('newFishPrice').value;
  const { ok, data } = await api('/api/admin/market-prices', { method: 'POST', body: JSON.stringify({ fishName, pricePerKg }) });
  if (!ok) { flashPriceMsg('priceError', data.error || 'Could not add price.'); return; }
  await loadPrices();
  flashPriceMsg('priceSuccess', 'Fish price added.');
}

async function deletePrice(id, name) {
  if (!confirm(`Remove the market price for ${name}?`)) return;
  await api(`/api/admin/market-prices/${id}`, { method: 'DELETE' });
  loadPrices();
}

/* ---------------- boot ---------------- */
window.onload = async function () {
  const { ok, data } = await api('/api/me');
  if (ok && data.user && data.user.is_admin) {
    enterDashboard(data.user);
  }
};
