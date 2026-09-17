import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  Briefcase, 
  Mail, 
  Phone, 
  CheckCircle2, 
  X, 
  Save, 
  AlertTriangle
} from 'lucide-react';
import { COMPANIES, DEPARTMENTS, getCompanyBadgeClass } from '../data/mockData';

export default function AdminEmployees({
  employees = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  loading = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    employeeCode: '',
    company: COMPANIES[0]?.id || 'Illuspace (Thailand) Co., Ltd.',
    departmentId: DEPARTMENTS[0]?.id || 'IT',
    position: '',
    email: '',
    phone: '',
    status: 'ACTIVE'
  });

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const code = String(emp.employeeCode || emp.emp_code || emp.id || '').toLowerCase();
    const name = String(emp.name || '').toLowerCase();
    const pos = String(emp.position || '').toLowerCase();
    const email = String(emp.email || '').toLowerCase();

    const matchSearch =
      name.includes(q) ||
      code.includes(q) ||
      pos.includes(q) ||
      email.includes(q);

    const empCompany = emp.company || 'Illuspace (Thailand) Co., Ltd.';
    const matchCompany = selectedCompany === 'ALL' || empCompany === selectedCompany;
    const matchDepartment = selectedDepartment === 'ALL' || emp.departmentId === selectedDepartment || emp.department === selectedDepartment;

    return matchSearch && matchCompany && matchDepartment;
  });

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      employeeCode: `EMP-${(employees.length + 1001).toString()}`,
      company: COMPANIES[0]?.id || 'Illuspace (Thailand) Co., Ltd.',
      departmentId: DEPARTMENTS[0]?.id || 'IT',
      position: '',
      email: '',
      phone: '',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '',
      employeeCode: emp.employeeCode || emp.emp_code || emp.id || '',
      company: emp.company || COMPANIES[0]?.id,
      departmentId: emp.departmentId || (emp.department?.includes('IT') ? 'IT' : emp.department?.includes('HR') ? 'HR' : 'IT'),
      position: emp.position || '',
      email: emp.email || '',
      phone: emp.phone || '',
      status: emp.status || (emp.is_active === 0 ? 'INACTIVE' : 'ACTIVE')
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const matchedDept = DEPARTMENTS.find(d => d.id === formData.departmentId);
    const departmentName = matchedDept ? matchedDept.name : formData.departmentId;

    const payload = {
      name: formData.name.trim(),
      employeeCode: formData.employeeCode.trim() || `EMP-${Date.now().toString(36).toUpperCase()}`,
      company: formData.company,
      departmentId: formData.departmentId,
      department: departmentName,
      position: formData.position ? formData.position.trim() : 'พนักงาน',
      email: formData.email ? formData.email.trim() : '',
      phone: formData.phone ? formData.phone.trim() : '',
      status: formData.status
    };

    if (editingEmployee) {
      onUpdateEmployee(editingEmployee.id, payload);
    } else {
      onAddEmployee(payload);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteEmployee(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>ระบบจัดการรายชื่อพนักงาน (Personnel Management)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ผู้ดูแลระบบสามารถเพิ่ม แก้ไข และลบข้อมูลพนักงาน กำหนดสังกัดบริษัทและแผนกสำหรับใช้ในระบบขอเบิกอุปกรณ์
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มพนักงานใหม่</span>
        </button>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">พนักงานทั้งหมด</span>
            <div className="text-xl font-bold text-slate-900">{employees.length} คน</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">สถานะปกติ (Active)</span>
            <div className="text-xl font-bold text-emerald-600">
              {employees.filter(e => e.status !== 'INACTIVE').length} คน
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">บริษัทในเครือ</span>
            <div className="text-xl font-bold text-blue-600">{COMPANIES.length} บริษัท</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">แผนกงาน</span>
            <div className="text-xl font-bold text-purple-600">{DEPARTMENTS.length} แผนก</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อพนักงาน, รหัส, ตำแหน่ง, อีเมล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Company Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">บริษัท:</span>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">ทั้งหมด ({employees.length})</option>
              {COMPANIES.map(c => (
                <option key={c.id} value={c.id}>{c.shortName}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">แผนก:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">ทุกแผนก</option>
              {DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id}>{d.id} - {d.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3.5 px-4">รหัส & ชื่อพนักงาน</th>
                <th className="py-3.5 px-4">สังกัดบริษัท</th>
                <th className="py-3.5 px-4">แผนก & ตำแหน่ง</th>
                <th className="py-3.5 px-4">ข้อมูลติดต่อ</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไขการค้นหา</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center border border-indigo-100 shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{emp.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{emp.employeeCode || emp.emp_code || emp.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium border ${getCompanyBadgeClass(emp.company || 'Illuspace (Thailand) Co., Ltd.')}`}>
                        {emp.company || 'Illuspace (Thailand) Co., Ltd.'}
                      </span>
                    </td>

                    {/* Department & Position */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{emp.department || emp.departmentId || '-'}</div>
                      <div className="text-[11px] text-slate-400">{emp.position || 'พนักงาน'}</div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-slate-600 text-[11px]">
                        {emp.email && (
                          <div className="flex items-center space-x-1.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{emp.email}</span>
                          </div>
                        )}
                        {emp.phone && (
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                        {!emp.email && !emp.phone && <span className="text-slate-400">-</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        emp.status === 'INACTIVE' || emp.is_active === 0
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${emp.status === 'INACTIVE' || emp.is_active === 0 ? 'bg-slate-400' : 'bg-emerald-500'}`}></span>
                        {emp.status === 'INACTIVE' || emp.is_active === 0 ? 'ไม่ใช้งาน' : 'ปกติ (Active)'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="แก้ไขข้อมูลพนักงาน"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(emp.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="ลบพนักงาน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>{editingEmployee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่เข้าสู่ระบบ'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              
              {/* Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมชาย ใจดี"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    รหัสพนักงาน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น EMP-1006"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  สังกัดบริษัท <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {COMPANIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Department & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    แผนกงาน <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่ง (Position)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น Programmer, HR Officer"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    placeholder="08x-xxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">สถานะในระบบ</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">ปกติ (Active - สามารถขอเบิกอุปกรณ์ได้)</option>
                  <option value="INACTIVE">ปิดการใช้งาน / พ้นสภาพ</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEmployee ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลพนักงาน'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการลบพนักงาน?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                การลบจะนำรายชื่อพนักงานนี้ออกจากระบบ คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20"
              >
                ยืนยันลบพนักงาน
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
