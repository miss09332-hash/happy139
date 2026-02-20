export type LeaveType = '特休' | '病假' | '事假' | '婚假' | '產假' | '喪假';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface Employee {
  id: string;
  name: string;
  department: string;
  avatar?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export const employees: Employee[] = [
  { id: '1', name: '王小明', department: '工程部' },
  { id: '2', name: '李美玲', department: '設計部' },
  { id: '3', name: '張大偉', department: '行銷部' },
  { id: '4', name: '陳怡君', department: '人資部' },
  { id: '5', name: '林志豪', department: '工程部' },
  { id: '6', name: '黃雅婷', department: '財務部' },
  { id: '7', name: '劉建宏', department: '工程部' },
  { id: '8', name: '吳佳蓉', department: '設計部' },
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: 'LR001',
    employeeId: '1',
    employeeName: '王小明',
    department: '工程部',
    leaveType: '特休',
    startDate: '2026-02-20',
    endDate: '2026-02-20',
    reason: '個人事務',
    status: 'approved',
    createdAt: '2026-02-18',
  },
  {
    id: 'LR002',
    employeeId: '2',
    employeeName: '李美玲',
    department: '設計部',
    leaveType: '病假',
    startDate: '2026-02-20',
    endDate: '2026-02-21',
    reason: '身體不適',
    status: 'approved',
    createdAt: '2026-02-19',
  },
  {
    id: 'LR003',
    employeeId: '3',
    employeeName: '張大偉',
    department: '行銷部',
    leaveType: '事假',
    startDate: '2026-02-22',
    endDate: '2026-02-22',
    reason: '辦理證件',
    status: 'pending',
    createdAt: '2026-02-19',
  },
  {
    id: 'LR004',
    employeeId: '5',
    employeeName: '林志豪',
    department: '工程部',
    leaveType: '特休',
    startDate: '2026-02-20',
    endDate: '2026-02-22',
    reason: '家庭旅遊',
    status: 'approved',
    createdAt: '2026-02-17',
  },
  {
    id: 'LR005',
    employeeId: '6',
    employeeName: '黃雅婷',
    department: '財務部',
    leaveType: '婚假',
    startDate: '2026-02-25',
    endDate: '2026-03-03',
    reason: '結婚',
    status: 'pending',
    createdAt: '2026-02-20',
  },
  {
    id: 'LR006',
    employeeId: '4',
    employeeName: '陳怡君',
    department: '人資部',
    leaveType: '病假',
    startDate: '2026-02-19',
    endDate: '2026-02-19',
    reason: '看診',
    status: 'approved',
    createdAt: '2026-02-18',
  },
];

export const leaveTypeColors: Record<LeaveType, string> = {
  '特休': 'bg-primary/10 text-primary',
  '病假': 'bg-destructive/10 text-destructive',
  '事假': 'bg-warning/10 text-warning',
  '婚假': 'bg-accent/10 text-accent',
  '產假': 'bg-info/10 text-info',
  '喪假': 'bg-muted text-muted-foreground',
};

export const statusLabels: Record<LeaveStatus, string> = {
  pending: '待審核',
  approved: '已核准',
  rejected: '已拒絕',
};

export const statusColors: Record<LeaveStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};
