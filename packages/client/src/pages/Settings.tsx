import { useState, useEffect } from 'react';
import { Save, Plus, Edit2, Trash2, User, Printer, Building2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { authApi } from '@/api/auth-api';
import type { User as UserType, CreateUserPayload, UserRole } from '@/types/auth';
import toast from 'react-hot-toast';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'staff' | 'printer'>('general');
  const [users, setUsers] = useState<UserType[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userForm, setUserForm] = useState<CreateUserPayload>({
    name: '',
    pin: '',
    role: 'cashier',
  });
  const [loading, setLoading] = useState(false);

  // General settings state
  const [taxRate, setTaxRate] = useState('10');
  const [currency, setCurrency] = useState('EUR');
  const [restaurantName, setRestaurantName] = useState('Namaste GIEN');
  const [restaurantAddress, setRestaurantAddress] = useState(
    '1 Rue de la Republique, 45500 Gien, France'
  );
  const [restaurantPhone, setRestaurantPhone] = useState('+33 2 38 00 00 00');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await authApi.getUsers();
      setUsers(data);
    } catch {
      // API may not be available
    }
  };

  const handleSaveGeneral = () => {
    toast.success('Settings saved');
  };

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      if (editingUser) {
        await authApi.updateUser(editingUser.id, userForm);
        toast.success('User updated');
      } else {
        await authApi.createUser(userForm);
        toast.success('User created');
      }
      loadUsers();
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ name: '', pin: '', role: 'cashier' });
    } catch {
      toast.error('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await authApi.deleteUser(id);
      toast.success('User deleted');
      loadUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setUserForm({ name: user.name, pin: '', role: user.role });
    setShowUserForm(true);
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Building2 },
    { id: 'staff' as const, label: 'Staff', icon: User },
    { id: 'printer' as const, label: 'Printer', icon: Printer },
  ];

  const roleColors: Record<UserRole, 'saffron' | 'info' | 'success' | 'warning'> = {
    admin: 'saffron',
    manager: 'info',
    cashier: 'success',
    kitchen: 'warning',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#1e3a5f]">
        <h1 className="text-xl font-bold text-cream">Settings</h1>
        <p className="text-sm text-cream/40 mt-0.5">System configuration and administration</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar tabs */}
        <div className="w-56 border-r border-[#1e3a5f] py-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-saffron bg-saffron/10 border-r-2 border-saffron'
                    : 'text-cream/50 hover:text-cream hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-base font-semibold text-cream mb-4">Restaurant Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-cream/60 mb-1.5">Restaurant Name</label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cream/60 mb-1.5">Address</label>
                    <input
                      type="text"
                      value={restaurantAddress}
                      onChange={(e) => setRestaurantAddress(e.target.value)}
                      className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cream/60 mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={restaurantPhone}
                      onChange={(e) => setRestaurantPhone(e.target.value)}
                      className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1e3a5f] pt-6">
                <h2 className="text-base font-semibold text-cream mb-4">Tax & Currency</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-cream/60 mb-1.5">
                      <Percent size={12} className="inline mr-1" />
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cream/60 mb-1.5">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
                    >
                      <option value="EUR">EUR ({'\u20AC'})</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP ({'\u00A3'})</option>
                    </select>
                  </div>
                </div>
              </div>

              <Button variant="primary" icon={<Save size={16} />} onClick={handleSaveGeneral}>
                Save Settings
              </Button>
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-cream">Staff Members</h2>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => {
                    setEditingUser(null);
                    setUserForm({ name: '', pin: '', role: 'cashier' });
                    setShowUserForm(true);
                  }}
                >
                  Add Staff
                </Button>
              </div>

              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 bg-[#162a4a] border border-[#1e3a5f] rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-cream">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-cream">{user.name}</p>
                      <p className="text-xs text-cream/40">ID: {user.id.slice(0, 8)}...</p>
                    </div>
                    <Badge variant={roleColors[user.role]}>{user.role}</Badge>
                    <Badge variant={user.active ? 'success' : 'danger'}>
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-lg hover:bg-white/10 text-cream/50 hover:text-cream transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 rounded-lg hover:bg-tandoori/10 text-cream/30 hover:text-tandoori transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-12 text-cream/30 text-sm">
                    No staff members found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Printer Tab */}
          {activeTab === 'printer' && (
            <div className="max-w-lg">
              <h2 className="text-base font-semibold text-cream mb-4">Printer Settings</h2>
              <div className="bg-[#162a4a] border border-[#1e3a5f] rounded-xl p-6 text-center">
                <Printer size={48} className="text-cream/20 mx-auto mb-3" />
                <p className="text-sm text-cream/50">Receipt printer configuration</p>
                <p className="text-xs text-cream/30 mt-2">
                  Connect a thermal receipt printer via USB or network to enable automatic receipt
                  printing.
                </p>
                <div className="mt-6 space-y-3">
                  <div>
                    <label className="block text-xs text-cream/60 mb-1.5">Printer IP Address</label>
                    <input
                      type="text"
                      placeholder="192.168.1.100"
                      className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50 placeholder:text-cream/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cream/60 mb-1.5">Port</label>
                    <input
                      type="text"
                      placeholder="9100"
                      className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50 placeholder:text-cream/20"
                    />
                  </div>
                  <Button variant="secondary" fullWidth>
                    Test Connection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User form modal */}
      <Modal
        isOpen={showUserForm}
        onClose={() => {
          setShowUserForm(false);
          setEditingUser(null);
        }}
        title={editingUser ? 'Edit Staff Member' : 'Add Staff Member'}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              className="border border-[#1e3a5f]"
              onClick={() => {
                setShowUserForm(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateUser} loading={loading}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-cream/60 mb-1.5">Name</label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/60 mb-1.5">
              PIN {editingUser && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              maxLength={4}
              value={userForm.pin}
              onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
              className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50 tracking-[0.5em]"
              placeholder="4-digit PIN"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/60 mb-1.5">Role</label>
            <select
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value as UserRole })
              }
              className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-saffron/50"
            >
              <option value="cashier">Cashier</option>
              <option value="kitchen">Kitchen</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
