import os

def update_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('\r\n', '\n') 
    
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
        else:
            print(f"Warning: Chunk not found in {filepath}\n{old[:50]}...")
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

      
tabs_old_employee = """        {user?.role?.toLowerCase() === 'admin' && (
          <div className="admin-tabs">
            <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Calendar size={18} />
              <span>Today's Orders</span>
            </NavLink>
            <NavLink to="/employee-panel" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Package size={18} />
              <span>Past Orders</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Customer Discounts</span>
            </NavLink>
            <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Shield size={18} />
              <span>Team Management</span>
            </NavLink>
          </div>
        )}"""

tabs_new_employee = """        {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
          <div className="admin-tabs">
            <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Calendar size={18} />
              <span>Today's Orders</span>
            </NavLink>
            <NavLink to="/employee-panel" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Package size={18} />
              <span>Past Orders</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Customer Discounts</span>
            </NavLink>
            {user?.role?.toLowerCase() === 'admin' && (
              <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                <Shield size={18} />
                <span>Team Management</span>
              </NavLink>
            )}
          </div>
        )}"""

update_file('src/screen/employee-panel/employee-panel.jsx', [
    (tabs_old_employee, tabs_new_employee)
])


tabs_old_todays = """        {user?.role?.toLowerCase() === 'admin' && (
          <div className="admin-tabs">
            <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Calendar size={18} />
              <span>Today's Orders</span>
            </NavLink>
            <NavLink to="/employee-panel" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Package size={18} />
              <span>Past Orders</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Customer Discounts</span>
            </NavLink>
            <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Shield size={18} />
              <span>Team Management</span>
            </NavLink>
          </div>
        )}"""

tabs_new_todays = """        {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager') && (
          <div className="admin-tabs">
            <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Calendar size={18} />
              <span>Today's Orders</span>
            </NavLink>
            <NavLink to="/employee-panel" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Package size={18} />
              <span>Past Orders</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Customer Discounts</span>
            </NavLink>
            {user?.role?.toLowerCase() === 'admin' && (
              <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
                <Shield size={18} />
                <span>Team Management</span>
              </NavLink>
            )}
          </div>
        )}"""

update_file('src/screen/todays-orders/todays-orders.jsx', [
    (tabs_old_todays, tabs_new_todays)
])


auth_old_user = """  const token = getAuthToken();
  const isAdminUser = isAdmin();

  useEffect(() => {
    if (!isAdminUser) {
      window.location.href = '/login';
      return;
    }
    fetchUsers();
  }, [isAdminUser]);"""

auth_new_user = """  const token = getAuthToken();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManagerOrAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager';

  useEffect(() => {
    if (!isManagerOrAdmin) {
      window.location.href = '/login';
      return;
    }
    fetchUsers();
  }, [isManagerOrAdmin]);"""

tabs_old_user = """        <div className="admin-tabs">
          <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Today's Orders</span>
          </NavLink>
          <NavLink to="/employee-panel" className="admin-tab">
            <Package size={18} />
            <span>Past Orders</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Customer Discounts</span>
          </NavLink>                   
          <NavLink to="/admin/employees" className="admin-tab">
            <Shield size={18} />
            <span>Team Management</span>
          </NavLink>
        </div>"""

tabs_new_user = """        <div className="admin-tabs">
          <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Today's Orders</span>
          </NavLink>
          <NavLink to="/employee-panel" className="admin-tab">
            <Package size={18} />
            <span>Past Orders</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Customer Discounts</span>
          </NavLink>
          {user?.role?.toLowerCase() === 'admin' && (
            <NavLink to="/admin/employees" className="admin-tab">
              <Shield size={18} />
              <span>Team Management</span>
            </NavLink>
          )}
        </div>"""

update_file('src/screen/user-management/user-management.jsx', [
    (auth_old_user, auth_new_user),
    (tabs_old_user, tabs_new_user)
])

tabs_old_emp_mgmt = """        <div className="admin-tabs">
          <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Today's Orders</span>
          </NavLink>
          <NavLink to="/employee-panel" className="admin-tab">
            <Package size={18} />
            <span>Past Orders</span>
          </NavLink>
          <NavLink to="/admin/users" className="admin-tab">
            <Users size={18} />
            <span>Customer Discounts</span>
          </NavLink>
          <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Shield size={18} />
            <span>Team Management</span>
          </NavLink>
        </div>"""

tabs_new_emp_mgmt = """        <div className="admin-tabs">
          <NavLink to="/admin/todays-orders" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Today's Orders</span>
          </NavLink>
          <NavLink to="/employee-panel" className="admin-tab">
            <Package size={18} />
            <span>Past Orders</span>
          </NavLink>
          <NavLink to="/admin/users" className="admin-tab">
            <Users size={18} />
            <span>Customer Discounts</span>
          </NavLink>
          {currentUser?.role?.toLowerCase() === 'admin' && (
            <NavLink to="/admin/employees" className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              <Shield size={18} />
              <span>Team Management</span>
            </NavLink>
          )}
        </div>"""

update_file('src/screen/employee-management/employee-management.jsx', [
    (tabs_old_emp_mgmt, tabs_new_emp_mgmt)
])
