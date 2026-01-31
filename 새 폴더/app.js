// 크레인 설비 이력 관리 시스템 - 메인 애플리케이션

// 데이터 관리 클래스
class DataManager {
    constructor() {
        this.equipments = JSON.parse(localStorage.getItem('craneEquipments') || '[]');
        this.histories = JSON.parse(localStorage.getItem('craneHistories') || '[]');
        this.schedules = JSON.parse(localStorage.getItem('craneSchedules') || '[]');
        this.notifications = JSON.parse(localStorage.getItem('craneNotifications') || '[]');
        this.dataLoaded = false;
    }

    async init() {
        // 데이터가 없으면 JSON 파일에서 로드 시도
        if (this.equipments.length === 0) {
            const loaded = await this.loadFromJsonFile();
            if (!loaded) {
                this.initSampleData();
            }
        }
        this.dataLoaded = true;
        return this;
    }

    async loadFromJsonFile() {
        try {
            const response = await fetch('crane_data.json');
            if (!response.ok) return false;

            const data = await response.json();
            if (data.equipments && data.equipments.length > 0) {
                this.equipments = data.equipments;
                this.histories = data.histories || [];
                this.schedules = data.schedules || [];
                this.notifications = data.notifications || [];
                this.saveAll();
                console.log(`✅ 엑셀 데이터 로드 완료: ${this.equipments.length}개 설비, ${this.histories.length}개 이력`);
                return true;
            }
            return false;
        } catch (e) {
            console.log('JSON 파일 로드 실패, 샘플 데이터 사용:', e);
            return false;
        }
    }

    // 데이터 새로고침 (엑셀 데이터 다시 로드)
    async reloadFromExcel() {
        localStorage.clear();
        this.equipments = [];
        this.histories = [];
        this.schedules = [];
        this.notifications = [];
        const loaded = await this.loadFromJsonFile();
        return loaded;
    }

    initSampleData() {
        this.equipments = [
            { id: 1, name: '천장크레인 #1', code: 'OHC-001', type: '천장크레인', capacity: 10, location: 'A동 1라인', manufacturer: '삼성중공업', installDate: '2020-03-15', status: '정상', nextInspection: '2024-03-15', notes: '주요 생산라인 크레인' },
            { id: 2, name: '천장크레인 #2', code: 'OHC-002', type: '천장크레인', capacity: 15, location: 'A동 2라인', manufacturer: '현대중공업', installDate: '2019-06-20', status: '점검중', nextInspection: '2024-02-01', notes: '' },
            { id: 3, name: '갠트리크레인', code: 'GC-001', type: '갠트리크레인', capacity: 50, location: '야외 적치장', manufacturer: '두산중공업', installDate: '2018-11-10', status: '정상', nextInspection: '2024-04-20', notes: '대형 자재 운반용' },
            { id: 4, name: '지브크레인 #1', code: 'JC-001', type: '지브크레인', capacity: 3, location: 'B동 조립실', manufacturer: '대우조선', installDate: '2021-02-28', status: '수리필요', nextInspection: '2024-02-15', notes: '와이어로프 교체 필요' },
            { id: 5, name: '호이스트 #1', code: 'HO-001', type: '호이스트', capacity: 2, location: 'C동 창고', manufacturer: 'DEMAG', installDate: '2022-07-01', status: '정상', nextInspection: '2024-05-01', notes: '' },
        ];

        this.histories = [
            { id: 1, equipmentId: 1, date: '2024-01-15', type: '정기점검', technician: '김안전', description: '월간 정기점검 실시. 브레이크 패드 마모 확인, 이상 없음.', result: '양호', cost: 0, notes: '' },
            { id: 2, equipmentId: 2, date: '2024-01-20', type: '수리', technician: '박정비', description: '리미트 스위치 교체 작업.', result: '양호', cost: 450000, notes: '' },
            { id: 3, equipmentId: 1, date: '2023-12-15', type: '안전검사', technician: '한국안전공단', description: '연간 법정 안전검사 실시.', result: '양호', cost: 300000, notes: '다음 검사: 2024-12' },
            { id: 4, equipmentId: 4, date: '2024-01-25', type: '자체점검', technician: '이기사', description: '와이어로프 마모 발견. 교체 권장.', result: '수리필요', cost: 0, notes: '긴급 조치 필요' },
            { id: 5, equipmentId: 3, date: '2024-01-10', type: '정기점검', technician: '김안전', description: '레일 및 주행부 점검 완료.', result: '양호', cost: 0, notes: '' },
        ];

        this.schedules = [
            { id: 1, equipmentId: 1, date: '2024-02-15', type: '정기점검', technician: '김안전', notes: '월간 정기점검' },
            { id: 2, equipmentId: 2, date: '2024-02-01', type: '정기점검', technician: '박정비', notes: '' },
            { id: 3, equipmentId: 4, date: '2024-02-10', type: '수리', technician: '이기사', notes: '와이어로프 교체' },
            { id: 4, equipmentId: 3, date: '2024-02-20', type: '안전검사', technician: '한국안전공단', notes: '법정 안전검사' },
        ];

        this.notifications = [
            { id: 1, title: '점검 일정 알림', message: '천장크레인 #2 정기점검이 3일 후 예정되어 있습니다.', date: new Date().toISOString(), read: false },
            { id: 2, title: '수리 필요', message: '지브크레인 #1 와이어로프 교체가 필요합니다.', date: new Date().toISOString(), read: false },
        ];

        this.saveAll();
    }

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    saveAll() {
        this.save('craneEquipments', this.equipments);
        this.save('craneHistories', this.histories);
        this.save('craneSchedules', this.schedules);
        this.save('craneNotifications', this.notifications);
    }

    getNextId(arr) {
        return arr.length > 0 ? Math.max(...arr.map(item => item.id)) + 1 : 1;
    }

    addEquipment(data) {
        data.id = this.getNextId(this.equipments);
        this.equipments.push(data);
        this.save('craneEquipments', this.equipments);
        return data;
    }

    updateEquipment(id, data) {
        const idx = this.equipments.findIndex(e => e.id === id);
        if (idx !== -1) {
            this.equipments[idx] = { ...this.equipments[idx], ...data };
            this.save('craneEquipments', this.equipments);
        }
    }

    deleteEquipment(id) {
        this.equipments = this.equipments.filter(e => e.id !== id);
        this.histories = this.histories.filter(h => h.equipmentId !== id);
        this.schedules = this.schedules.filter(s => s.equipmentId !== id);
        this.saveAll();
    }

    addHistory(data) {
        data.id = this.getNextId(this.histories);
        this.histories.push(data);
        this.save('craneHistories', this.histories);
        return data;
    }

    updateHistory(id, data) {
        const idx = this.histories.findIndex(h => h.id === id);
        if (idx !== -1) {
            this.histories[idx] = { ...this.histories[idx], ...data };
            this.save('craneHistories', this.histories);
        }
    }

    deleteHistory(id) {
        this.histories = this.histories.filter(h => h.id !== id);
        this.save('craneHistories', this.histories);
    }

    addSchedule(data) {
        data.id = this.getNextId(this.schedules);
        this.schedules.push(data);
        this.save('craneSchedules', this.schedules);
        return data;
    }

    updateSchedule(id, data) {
        const idx = this.schedules.findIndex(s => s.id === id);
        if (idx !== -1) {
            this.schedules[idx] = { ...this.schedules[idx], ...data };
            this.save('craneSchedules', this.schedules);
        }
    }

    deleteSchedule(id) {
        this.schedules = this.schedules.filter(s => s.id !== id);
        this.save('craneSchedules', this.schedules);
    }

    getEquipmentById(id) {
        return this.equipments.find(e => e.id === id);
    }

    getHistoriesByEquipment(equipmentId) {
        return this.histories.filter(h => h.equipmentId === equipmentId).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getSchedulesByEquipment(equipmentId) {
        return this.schedules.filter(s => s.equipmentId === equipmentId);
    }

    exportData() {
        return JSON.stringify({ equipments: this.equipments, histories: this.histories, schedules: this.schedules, notifications: this.notifications, exportDate: new Date().toISOString() }, null, 2);
    }

    importData(json) {
        try {
            const data = JSON.parse(json);
            if (data.equipments) this.equipments = data.equipments;
            if (data.histories) this.histories = data.histories;
            if (data.schedules) this.schedules = data.schedules;
            if (data.notifications) this.notifications = data.notifications;
            this.saveAll();
            return true;
        } catch (e) {
            return false;
        }
    }
}

// 애플리케이션 클래스
class CraneApp {
    constructor() {
        this.data = new DataManager();
        this.currentPage = 'dashboard';
        this.currentMonth = new Date();
    }

    async init() {
        // 로딩 표시
        document.body.innerHTML += '<div id="loadingOverlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.95);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:20px;"><div style="width:50px;height:50px;border:4px solid #334155;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div><p style="color:#94a3b8;">데이터 로딩 중...</p></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';

        // 데이터 로드
        await this.data.init();

        // 로딩 제거
        document.getElementById('loadingOverlay')?.remove();

        this.bindEvents();
        this.renderDashboard();
        this.updateNotificationBadge();

        // 로드 완료 메시지
        if (this.data.equipments.length > 0) {
            this.showToast(`${this.data.equipments.length}개 설비, ${this.data.histories.length}개 이력 로드 완료`, 'success');
        }
    }

    bindEvents() {
        // 네비게이션
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.page);
            });
        });

        // 메뉴 토글 (모바일)
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        // 알림 버튼
        document.getElementById('notificationBtn').addEventListener('click', () => {
            document.getElementById('notificationPanel').classList.toggle('active');
            this.renderNotifications();
        });

        // 모두 읽음 처리
        document.getElementById('markAllRead').addEventListener('click', () => {
            this.data.notifications.forEach(n => n.read = true);
            this.data.save('craneNotifications', this.data.notifications);
            this.updateNotificationBadge();
            this.renderNotifications();
        });

        // 전역 검색
        document.getElementById('globalSearch').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // 설비 추가/수정
        document.getElementById('addEquipmentBtn').addEventListener('click', () => this.openEquipmentModal());
        document.getElementById('closeEquipmentModal').addEventListener('click', () => this.closeModal('equipmentModal'));
        document.getElementById('cancelEquipment').addEventListener('click', () => this.closeModal('equipmentModal'));
        document.getElementById('equipmentForm').addEventListener('submit', (e) => this.handleEquipmentSubmit(e));

        // 이력 추가/수정
        document.getElementById('addHistoryBtn').addEventListener('click', () => this.openHistoryModal());
        document.getElementById('closeHistoryModal').addEventListener('click', () => this.closeModal('historyModal'));
        document.getElementById('cancelHistory').addEventListener('click', () => this.closeModal('historyModal'));
        document.getElementById('historyForm').addEventListener('submit', (e) => this.handleHistorySubmit(e));

        // 일정 추가/수정
        document.getElementById('addScheduleBtn').addEventListener('click', () => this.openScheduleModal());
        document.getElementById('closeScheduleModal').addEventListener('click', () => this.closeModal('scheduleModal'));
        document.getElementById('cancelSchedule').addEventListener('click', () => this.closeModal('scheduleModal'));
        document.getElementById('scheduleForm').addEventListener('submit', (e) => this.handleScheduleSubmit(e));

        // 설비 상세 모달
        document.getElementById('closeEquipmentDetailModal').addEventListener('click', () => this.closeModal('equipmentDetailModal'));

        // 필터
        document.getElementById('equipmentTypeFilter').addEventListener('change', () => this.renderEquipmentGrid());
        document.getElementById('equipmentStatusFilter').addEventListener('change', () => this.renderEquipmentGrid());
        document.getElementById('historyEquipmentFilter').addEventListener('change', () => this.renderHistoryTable());
        document.getElementById('historyTypeFilter').addEventListener('change', () => this.renderHistoryTable());
        document.getElementById('historyMonthFilter').addEventListener('change', () => this.renderHistoryTable());

        // 부품 통계 필터
        document.getElementById('partsEquipmentFilter').addEventListener('change', () => this.renderPartsPage());
        document.getElementById('partsTypeFilter').addEventListener('change', () => this.renderPartsHistory());

        // 캘린더 네비게이션
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        // 보고서
        document.getElementById('generateMonthlyReport').addEventListener('click', () => this.generateMonthlyReport());
        document.getElementById('generateEquipmentReport').addEventListener('click', () => this.generateEquipmentReport());
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('change', (e) => this.importData(e));
        document.getElementById('reloadExcelData').addEventListener('click', () => this.reloadExcelData());
        document.getElementById('showYearlyStatsFn').addEventListener('click', () => this.showYearlyStats());
        document.getElementById('closeStatsModal').addEventListener('click', () => this.closeModal('statsModal'));

        // 모달 외부 클릭 닫기
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });
    }

    navigateTo(page) {
        this.currentPage = page;

        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}Page`).classList.add('active');

        const titles = { dashboard: '대시보드', equipment: '설비 목록', history: '이력 관리', parts: '부품 통계', schedule: '점검 일정', reports: '보고서' };
        document.getElementById('pageTitle').textContent = titles[page] || page;

        document.getElementById('sidebar').classList.remove('active');

        switch (page) {
            case 'dashboard': this.renderDashboard(); break;
            case 'equipment': this.renderEquipmentGrid(); break;
            case 'history': this.renderHistoryPage(); break;
            case 'parts': this.renderPartsPage(); break;
            case 'schedule': this.renderCalendar(); break;
            case 'reports': this.renderReportsPage(); break;
        }
    }

    // 대시보드 렌더링
    renderDashboard() {
        const stats = this.calculateStats();
        document.getElementById('totalEquipment').textContent = stats.total;
        document.getElementById('normalEquipment').textContent = stats.normal;
        document.getElementById('maintenanceEquipment').textContent = stats.maintenance;
        document.getElementById('issueEquipment').textContent = stats.issue;

        this.renderUpcomingInspections();
        this.renderRecentHistory();
        this.renderStatusChart(stats);
        this.renderAlerts();
    }

    calculateStats() {
        const total = this.data.equipments.length;
        const normal = this.data.equipments.filter(e => e.status === '정상').length;
        const maintenance = this.data.equipments.filter(e => e.status === '점검중').length;
        const issue = this.data.equipments.filter(e => e.status === '수리필요' || e.status === '가동중지').length;
        return { total, normal, maintenance, issue };
    }

    renderUpcomingInspections() {
        const container = document.getElementById('upcomingInspections');
        const today = new Date();
        const upcoming = this.data.schedules
            .filter(s => new Date(s.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = '<li class="empty-state"><i class="fas fa-calendar-check"></i><p>예정된 점검이 없습니다.</p></li>';
            return;
        }

        container.innerHTML = upcoming.map(schedule => {
            const equipment = this.data.getEquipmentById(schedule.equipmentId);
            const daysLeft = Math.ceil((new Date(schedule.date) - today) / (1000 * 60 * 60 * 24));
            return `
                <li>
                    <div class="list-icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white;">
                        <i class="fas fa-wrench"></i>
                    </div>
                    <div class="list-content">
                        <h4>${equipment ? equipment.name : '알 수 없음'}</h4>
                        <p>${schedule.type}</p>
                    </div>
                    <span class="list-date">${daysLeft === 0 ? '오늘' : daysLeft + '일 후'}</span>
                </li>
            `;
        }).join('');
    }

    renderRecentHistory() {
        const container = document.getElementById('recentHistory');
        const recent = this.data.histories.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<li class="empty-state"><i class="fas fa-history"></i><p>이력이 없습니다.</p></li>';
            return;
        }

        const typeColors = { '정기점검': '#3b82f6', '자체점검': '#22c55e', '수리': '#f59e0b', '부품교체': '#8b5cf6', '안전검사': '#ef4444', '기타': '#64748b' };

        container.innerHTML = recent.map(history => {
            const equipment = this.data.getEquipmentById(history.equipmentId);
            return `
                <li>
                    <div class="list-icon" style="background: ${typeColors[history.type] || '#64748b'}; color: white;">
                        <i class="fas fa-clipboard-check"></i>
                    </div>
                    <div class="list-content">
                        <h4>${equipment ? equipment.name : '알 수 없음'}</h4>
                        <p>${history.type} - ${history.result}</p>
                    </div>
                    <span class="list-date">${this.formatDate(history.date)}</span>
                </li>
            `;
        }).join('');
    }

    renderStatusChart(stats) {
        const container = document.getElementById('statusChart');
        const maxValue = Math.max(stats.normal, stats.maintenance, stats.issue, 1);

        const data = [
            { label: '정상', value: stats.normal, color: '#22c55e' },
            { label: '점검중', value: stats.maintenance, color: '#f59e0b' },
            { label: '이상', value: stats.issue, color: '#ef4444' }
        ];

        container.innerHTML = data.map(item => `
            <div class="chart-bar">
                <div class="chart-bar-fill" style="height: ${(item.value / maxValue) * 150}px; background: ${item.color};">
                    <span>${item.value}</span>
                </div>
                <span class="chart-bar-label">${item.label}</span>
            </div>
        `).join('');
    }

    renderAlerts() {
        const container = document.getElementById('alertsList');
        const alerts = [];
        const today = new Date();

        // 점검 예정일 임박 알림
        this.data.equipments.forEach(eq => {
            if (eq.nextInspection) {
                const inspectionDate = new Date(eq.nextInspection);
                const daysLeft = Math.ceil((inspectionDate - today) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 7 && daysLeft >= 0) {
                    alerts.push({ type: 'warning', icon: 'fa-clock', message: `${eq.name} 점검일 ${daysLeft}일 남음` });
                } else if (daysLeft < 0) {
                    alerts.push({ type: 'danger', icon: 'fa-exclamation-circle', message: `${eq.name} 점검일 ${Math.abs(daysLeft)}일 경과` });
                }
            }
        });

        // 상태 이상 알림
        this.data.equipments.filter(eq => eq.status === '수리필요' || eq.status === '가동중지').forEach(eq => {
            alerts.push({ type: 'danger', icon: 'fa-exclamation-triangle', message: `${eq.name}: ${eq.status}` });
        });

        if (alerts.length === 0) {
            container.innerHTML = '<li class="empty-state"><i class="fas fa-check-circle"></i><p>알림이 없습니다.</p></li>';
            return;
        }

        container.innerHTML = alerts.slice(0, 5).map(alert => `
            <li style="border-left: 3px solid var(--${alert.type === 'danger' ? 'danger' : 'warning'});">
                <i class="fas ${alert.icon}" style="color: var(--${alert.type === 'danger' ? 'danger' : 'warning'});"></i>
                <span>${alert.message}</span>
            </li>
        `).join('');
    }

    // 설비 목록 렌더링
    renderEquipmentGrid() {
        const container = document.getElementById('equipmentGrid');
        let equipments = [...this.data.equipments];

        const typeFilter = document.getElementById('equipmentTypeFilter').value;
        const statusFilter = document.getElementById('equipmentStatusFilter').value;

        if (typeFilter) equipments = equipments.filter(e => e.type === typeFilter);
        if (statusFilter) equipments = equipments.filter(e => e.status === statusFilter);

        // 검색 필터
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            equipments = equipments.filter(e => {
                // 설비 정보 검색
                if (e.name.toLowerCase().includes(query) ||
                    e.code.toLowerCase().includes(query) ||
                    e.location.toLowerCase().includes(query) ||
                    (e.manufacturer && e.manufacturer.toLowerCase().includes(query)) ||
                    (e.notes && e.notes.toLowerCase().includes(query))) {
                    return true;
                }
                // 관련 이력 검색
                const histories = this.data.getHistoriesByEquipment(e.id);
                return histories.some(h =>
                    h.description.toLowerCase().includes(query) ||
                    (h.notes && h.notes.toLowerCase().includes(query)) ||
                    h.technician.toLowerCase().includes(query)
                );
            });
        }

        if (equipments.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-industry"></i><h3>설비가 없습니다</h3><p>검색 조건에 맞는 설비가 없습니다.</p></div>';
            return;
        }

        container.innerHTML = equipments.map(eq => `
            <div class="equipment-card" onclick="app.openEquipmentDetail(${eq.id})">
                <div class="equipment-card-header">
                    <div>
                        <h3>${eq.name}</h3>
                        <p>${eq.code} | ${eq.type}</p>
                    </div>
                    <span class="status-badge status-${eq.status}">${eq.status}</span>
                </div>
                <div class="equipment-card-body">
                    <div class="equipment-info">
                        <div class="info-item"><label>설치 위치</label><span>${eq.location}</span></div>
                        <div class="info-item"><label>정격하중</label><span>${eq.capacity ? eq.capacity + ' 톤' : '-'}</span></div>
                        <div class="info-item"><label>제조사</label><span>${eq.manufacturer || '-'}</span></div>
                        <div class="info-item"><label>다음 점검</label><span>${eq.nextInspection ? this.formatDate(eq.nextInspection) : '-'}</span></div>
                    </div>
                </div>
                <div class="equipment-card-footer">
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); app.openEquipmentModal(${eq.id});"><i class="fas fa-edit"></i> 수정</button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); app.deleteEquipment(${eq.id});"><i class="fas fa-trash"></i> 삭제</button>
                </div>
            </div>
        `).join('');
    }

    // 이력 페이지 렌더링
    renderHistoryPage() {
        this.populateEquipmentFilter('historyEquipmentFilter');
        this.renderHistoryTable();
    }

    renderHistoryTable() {
        const container = document.getElementById('historyTableBody');
        let histories = [...this.data.histories];

        const equipmentFilter = document.getElementById('historyEquipmentFilter').value;
        const typeFilter = document.getElementById('historyTypeFilter').value;
        const monthFilter = document.getElementById('historyMonthFilter').value;

        if (equipmentFilter) histories = histories.filter(h => h.equipmentId === parseInt(equipmentFilter));
        if (typeFilter) histories = histories.filter(h => h.type === typeFilter);
        if (monthFilter) histories = histories.filter(h => h.date.startsWith(monthFilter));

        // 검색 필터
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            histories = histories.filter(h => {
                const eq = this.data.getEquipmentById(h.equipmentId);
                return (
                    h.description.toLowerCase().includes(query) ||
                    (h.notes && h.notes.toLowerCase().includes(query)) ||
                    h.technician.toLowerCase().includes(query) ||
                    (eq && eq.name.toLowerCase().includes(query))
                );
            });
        }

        histories.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (histories.length === 0) {
            container.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-history"></i><p>이력이 없습니다.</p></td></tr>';
            return;
        }

        container.innerHTML = histories.map(h => {
            const equipment = this.data.getEquipmentById(h.equipmentId);
            return `
                <tr>
                    <td>${this.formatDate(h.date)}</td>
                    <td>${equipment ? equipment.name : '알 수 없음'}</td>
                    <td>${h.type}</td>
                    <td>${h.technician}</td>
                    <td>${h.description.substring(0, 30)}${h.description.length > 30 ? '...' : ''}</td>
                    <td><span class="result-badge result-${h.result}">${h.result}</span></td>
                    <td class="action-btns">
                        <button class="btn btn-secondary btn-sm" onclick="app.openHistoryModal(${h.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteHistory(${h.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 캘린더 렌더링
    renderCalendar() {
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        document.getElementById('currentMonth').textContent = `${year}년 ${monthNames[month]}`;

        const container = document.getElementById('calendarGrid');
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

        let html = dayNames.map(day => `<div class="calendar-day-header">${day}</div>`).join('');

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const today = new Date();

        // 이전 달
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day other-month"><div class="calendar-day-number">${daysInPrevMonth - i}</div></div>`;
        }

        // 현재 달
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const daySchedules = this.data.schedules.filter(s => s.date === dateStr);

            html += `
                <div class="calendar-day${isToday ? ' today' : ''}">
                    <div class="calendar-day-number">${day}</div>
                    ${daySchedules.map(s => {
                const eq = this.data.getEquipmentById(s.equipmentId);
                return `<div class="calendar-event" onclick="app.openScheduleModal(${s.id})">${eq ? eq.name : ''} - ${s.type}</div>`;
            }).join('')}
                </div>
            `;
        }

        // 다음 달
        const remainingDays = (7 - ((firstDay + daysInMonth) % 7)) % 7;
        for (let i = 1; i <= remainingDays; i++) {
            html += `<div class="calendar-day other-month"><div class="calendar-day-number">${i}</div></div>`;
        }

        container.innerHTML = html;
    }

    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.renderCalendar();
    }

    // 부품 통계 페이지 렌더링
    renderPartsPage() {
        this.populateEquipmentFilter('partsEquipmentFilter');
        this.populatePartsFilter('partsTypeFilter');
        this.analyzeAndRenderParts();
    }

    getPartsKeywords() {
        return {
            'Wire Rope': ['wire rope', 'wire', '와이어', '와이어로프'],
            'Motor': ['motor', '모터'],
            'Brake': ['brake', '브레이크'],
            'Bearing': ['bearing', 'brg', '베어링'],
            'Reducer': ['reducer', '감속기', '리듀서'],
            'Pump': ['pump', '펌프'],
            'Valve': ['valve', '밸브'],
            'Inverter': ['inverter', '인버터'],
            'Contactor': ['contactor', '접촉기', '콘탯타'],
            'Relay': ['relay', '릴레이', '계전기'],
            'Limit Switch': ['limit switch', 'limit', '리미트', '리밋'],
            'Cable': ['cable', '케이블'],
            'Hose': ['hose', '호스'],
            'Wheel': ['wheel', '휠', '바퀴'],
            'Coupling': ['coupling', '커플링'],
            'Chain': ['chain', '체인'],
            'Hook': ['hook', '훅', '후크'],
            'Drum': ['drum', '드럼'],
            'Sheave': ['sheave', '시브'],
            'Fuse': ['fuse', '퓨즈'],
            'O-Ring': ['o-ring', 'oring', '오링'],
            'Oil': ['oil', '오일', '유압유', '급유'],
            'Filter': ['filter', '필터'],
            'Bolt': ['bolt', 'bolting', '볼트', '볼팅'],
            'Cylinder': ['cylinder', 'cyl', '실린더'],
            'Grab': ['grab', '그랩'],
            'Trolley': ['trolley', '트롤리'],
            'Rail': ['rail', '레일'],
            'Bus Bar': ['bus bar', 'busbar', '버스바'],
            'Panel': ['panel', '패널'],
            'Remote': ['remote', '리모콘', '리모컨', '원격'],
        };
    }

    analyzeAndRenderParts() {
        const keywords = this.getPartsKeywords();
        const equipmentFilter = document.getElementById('partsEquipmentFilter').value;

        let histories = this.data.histories;
        if (equipmentFilter) {
            histories = histories.filter(h => h.equipmentId === parseInt(equipmentFilter));
        }

        const partsCount = {};
        const partLastDate = {};

        // 초기화
        for (const part in keywords) {
            partsCount[part] = 0;
            partLastDate[part] = null;
        }
        partsCount['기타'] = 0;

        // 분석
        histories.forEach(h => {
            const desc = (h.description + ' ' + (h.notes || '')).toLowerCase();
            let matched = false;

            for (const [part, kwList] of Object.entries(keywords)) {
                if (kwList.some(kw => desc.includes(kw.toLowerCase()))) {
                    partsCount[part]++;
                    matched = true;

                    if (!partLastDate[part] || new Date(h.date) > new Date(partLastDate[part])) {
                        partLastDate[part] = h.date;
                    }
                    break;
                }
            }

            /* 기타 항목은 너무 많이 나올 수 있으므로 제외하거나 필요시 주석 해제
            if (!matched) {
                partsCount['기타']++;
            }
            */
        });

        // 정렬
        const sortedParts = Object.entries(partsCount)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);

        // 통계 요약 업데이트
        const totalReplacements = sortedParts.reduce((sum, item) => sum + item[1], 0);
        document.getElementById('totalPartsCount').textContent = totalReplacements.toLocaleString();
        document.getElementById('topPartName').textContent = sortedParts.length > 0 ? `${sortedParts[0][0]} (${sortedParts[0][1]}회)` : '-';

        // 차트 렌더링 (상위 15개)
        const chartContainer = document.getElementById('partsChart');
        const maxVal = sortedParts.length > 0 ? sortedParts[0][1] : 1;

        chartContainer.innerHTML = sortedParts.slice(0, 15).map((item, index) => {
            const width = (item[1] / maxVal) * 100;
            const colorClass = `part-color-${(index % 15) + 1}`;
            return `
                <div class="horizontal-bar-item" onclick="app.renderPartsHistory('${item[0]}'); document.getElementById('partsTypeFilter').value = '${item[0]}';" style="cursor:pointer;" title="클릭하여 상세 이력 보기">
                    <div class="horizontal-bar-label">${item[0]}</div>
                    <div class="horizontal-bar-container">
                        <div class="horizontal-bar-fill ${colorClass}" style="width: ${width}%">
                            <span>${item[1]}</span>
                        </div>
                    </div>
                    <div class="horizontal-bar-value">${item[1]}회</div>
                </div>
            `;
        }).join('');

        if (sortedParts.length === 0) {
            chartContainer.innerHTML = '<div class="empty-state"><p>데이터가 없습니다.</p></div>';
        }

        // 상세 테이블 렌더링
        const tableBody = document.getElementById('partsTableBody');
        tableBody.innerHTML = sortedParts.map((item, index) => {
            const ratio = ((item[1] / totalReplacements) * 100).toFixed(1);
            return `
                <tr onclick="app.renderPartsHistory('${item[0]}'); document.getElementById('partsTypeFilter').value = '${item[0]}';" style="cursor:pointer;" title="클릭하여 상세 이력 보기">
                    <td><span class="rank-badge rank-${index + 1 <= 3 ? index + 1 : 'default'}">${index + 1}</span></td>
                    <td>${item[0]}</td>
                    <td>${item[1]}회</td>
                    <td>
                        <div class="ratio-bar"><div class="ratio-bar-fill" style="width: ${ratio}%"></div></div>
                        ${ratio}%
                    </td>
                    <td>${partLastDate[item[0]] ? this.formatDate(partLastDate[item[0]]) : '-'}</td>
                </tr>
            `;
        }).join('');

        // 상위 부품 자동 선택 (초기 로드 시)
        // if (sortedParts.length > 0) this.renderPartsHistory(sortedParts[0][0]);
        // else 
        this.renderPartsHistory();
    }

    renderPartsHistory(selectedPart = null) {
        const typeFilter = selectedPart || document.getElementById('partsTypeFilter').value;
        const equipmentFilter = document.getElementById('partsEquipmentFilter').value;

        // 셀렉트 박스 동기화 (클릭으로 왔을 경우)
        if (selectedPart) {
            const select = document.getElementById('partsTypeFilter');
            if (select.querySelector(`option[value="${selectedPart}"]`)) {
                select.value = selectedPart;
            }
        }

        let histories = [...this.data.histories];

        if (equipmentFilter) {
            histories = histories.filter(h => h.equipmentId === parseInt(equipmentFilter));
        }

        if (typeFilter) {
            const keywords = this.getPartsKeywords()[typeFilter];
            if (keywords) {
                histories = histories.filter(h => {
                    const desc = (h.description + ' ' + (h.notes || '')).toLowerCase();
                    return keywords.some(kw => desc.includes(kw.toLowerCase()));
                });
            }
        }

        // 부품 관련 이력만 필터링 (필터 없을 때)
        if (!typeFilter) {
            const allKeywords = Object.values(this.getPartsKeywords()).flat();
            histories = histories.filter(h => {
                const desc = (h.description + ' ' + (h.notes || '')).toLowerCase();
                return allKeywords.some(kw => desc.includes(kw.toLowerCase()));
            });
        }

        histories.sort((a, b) => new Date(b.date) - new Date(a.date));

        const container = document.getElementById('partsHistoryTableBody');
        if (histories.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="empty-state">해당 이력이 없습니다.</td></tr>';
            return;
        }

        container.innerHTML = histories.slice(0, 50).map(h => {
            const eq = this.data.getEquipmentById(h.equipmentId);

            // 부품 태그 찾기
            let matchedPart = '';
            const desc = (h.description + ' ' + (h.notes || '')).toLowerCase();
            for (const [part, kwList] of Object.entries(this.getPartsKeywords())) {
                if (kwList.some(kw => desc.includes(kw.toLowerCase()))) {
                    matchedPart = `<span class="status-badge" style="background:var(--dark-hover);color:var(--text-primary);margin-right:6px;">${part}</span>`;
                    break;
                }
            }

            return `
                <tr>
                    <td>${this.formatDate(h.date)}</td>
                    <td>${eq ? eq.name : '알 수 없음'}</td>
                    <td>${matchedPart}</td>
                    <td>${h.description}</td>
                </tr>
            `;
        }).join('');
    }

    populatePartsFilter(selectId) {
        const select = document.getElementById(selectId);
        const originalVal = select.value;
        select.innerHTML = '<option value="">전체 부품</option>';
        Object.keys(this.getPartsKeywords()).sort().forEach(part => {
            const option = document.createElement('option');
            option.value = part;
            option.textContent = part;
            select.appendChild(option);
        });
        if (originalVal) select.value = originalVal;
    }

    // 보고서 페이지 렌더링
    renderReportsPage() {
        this.populateEquipmentFilter('equipmentReportSelect');
        document.getElementById('monthlyReportMonth').value = new Date().toISOString().slice(0, 7);

        // 연도 선택 채우기
        const yearSelect = document.getElementById('statsYearSelect');
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '';
        for (let y = currentYear; y >= currentYear - 10; y--) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y + '년';
            yearSelect.appendChild(opt);
        }
    }

    // 연간 통계 보기
    showYearlyStats() {
        const year = parseInt(document.getElementById('statsYearSelect').value);
        const container = document.getElementById('yearlyStatsTableBody');
        container.innerHTML = '';

        // 데이터 집계: { equipId: [0, 0, ..., 0] } (1월~12월)
        const stats = {};

        this.data.equipments.forEach(eq => {
            stats[eq.id] = Array(12).fill(0);
        });

        this.data.histories.forEach(h => {
            const hDate = new Date(h.date);
            if (hDate.getFullYear() === year) {
                const month = hDate.getMonth(); // 0~11
                if (stats[h.equipmentId]) {
                    stats[h.equipmentId][month]++;
                }
            }
        });

        // 테이블 렌더링
        this.data.equipments.forEach(eq => {
            const monthlyCounts = stats[eq.id];
            const total = monthlyCounts.reduce((a, b) => a + b, 0);

            // 데이터가 있는 경우만 표시하려면 아래 주석 해제
            if (total === 0) return;

            const tr = document.createElement('tr');
            let html = `<td style="font-weight:600; background:rgba(0,0,0,0.2); position:sticky; left:0; z-index:5;">${eq.name}</td>`;

            monthlyCounts.forEach(count => {
                const style = count > 0 ? `background: rgba(59, 130, 246, ${Math.min(count / 5, 1) * 0.5}); font-weight:600;` : 'color: #64748b;';
                html += `<td style="${style}">${count > 0 ? count : '-'}</td>`;
            });

            html += `<td style="font-weight:700; color: #fbbf24;">${total}</td>`;
            tr.innerHTML = html;
            container.appendChild(tr);
        });

        document.getElementById('statsModalTitle').textContent = `${year}년 설비별 보수 현황`;
        this.openModal('statsModal');
    }

    // 검색 처리
    handleSearch(query) {
        this.searchQuery = query.trim();

        // 검색어가 있고, 현재 페이지가 검색 결과를 보여줄 수 없는 페이지라면 설비 목록으로 이동
        if (this.searchQuery && ['dashboard', 'schedule', 'reports', 'parts'].includes(this.currentPage)) {
            this.navigateTo('equipment');
            // navigateTo에서 active 클래스를 바꾸므로, 여기서 다시 렌더링할 필요는 없음 (navigateTo가 renderEquipmentGrid 호출함)
            return;
        }

        // 현재 페이지에 맞게 렌더링 업데이트
        if (this.currentPage === 'equipment') {
            this.renderEquipmentGrid();
        } else if (this.currentPage === 'history') {
            this.renderHistoryTable();
        }
    }

    // 유틸리티 함수들
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }

    populateEquipmentFilter(selectId) {
        const select = document.getElementById(selectId);
        const firstOption = select.querySelector('option');
        select.innerHTML = '';
        select.appendChild(firstOption);
        this.data.equipments.forEach(eq => {
            const option = document.createElement('option');
            option.value = eq.id;
            option.textContent = eq.name;
            select.appendChild(option);
        });
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', error: 'fa-times-circle', info: 'fa-info-circle' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    updateNotificationBadge() {
        const unreadCount = this.data.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    renderNotifications() {
        const container = document.getElementById('notificationList');
        if (this.data.notifications.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>알림이 없습니다.</p></div>';
            return;
        }

        container.innerHTML = this.data.notifications.map(n => `
            <div class="notification-item${n.read ? '' : ' unread'}">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <div class="time">${this.formatDate(n.date)}</div>
            </div>
        `).join('');
    }

    handleSearch(query) {
        if (!query) return;
        const results = this.data.equipments.filter(e =>
            e.name.toLowerCase().includes(query.toLowerCase()) ||
            e.code.toLowerCase().includes(query.toLowerCase()) ||
            e.location.toLowerCase().includes(query.toLowerCase())
        );
        if (results.length > 0) {
            this.navigateTo('equipment');
            document.getElementById('equipmentTypeFilter').value = '';
            document.getElementById('equipmentStatusFilter').value = '';
            this.renderEquipmentGrid();
        }
    }

    // 설비 CRUD
    openEquipmentModal(id = null) {
        const form = document.getElementById('equipmentForm');
        form.reset();
        document.getElementById('equipmentId').value = '';
        document.getElementById('equipmentModalTitle').textContent = '설비 추가';

        if (id) {
            const eq = this.data.getEquipmentById(id);
            if (eq) {
                document.getElementById('equipmentId').value = eq.id;
                document.getElementById('equipmentName').value = eq.name;
                document.getElementById('equipmentCode').value = eq.code;
                document.getElementById('equipmentType').value = eq.type;
                document.getElementById('equipmentCapacity').value = eq.capacity || '';
                document.getElementById('equipmentLocation').value = eq.location;
                document.getElementById('equipmentManufacturer').value = eq.manufacturer || '';
                document.getElementById('equipmentInstallDate').value = eq.installDate || '';
                document.getElementById('equipmentStatus').value = eq.status;
                document.getElementById('nextInspectionDate').value = eq.nextInspection || '';
                document.getElementById('equipmentNotes').value = eq.notes || '';
                document.getElementById('equipmentModalTitle').textContent = '설비 수정';
            }
        }
        this.openModal('equipmentModal');
    }

    handleEquipmentSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('equipmentId').value;
        const data = {
            name: document.getElementById('equipmentName').value,
            code: document.getElementById('equipmentCode').value,
            type: document.getElementById('equipmentType').value,
            capacity: parseFloat(document.getElementById('equipmentCapacity').value) || null,
            location: document.getElementById('equipmentLocation').value,
            manufacturer: document.getElementById('equipmentManufacturer').value,
            installDate: document.getElementById('equipmentInstallDate').value,
            status: document.getElementById('equipmentStatus').value,
            nextInspection: document.getElementById('nextInspectionDate').value,
            notes: document.getElementById('equipmentNotes').value
        };

        if (id) {
            this.data.updateEquipment(parseInt(id), data);
            this.showToast('설비가 수정되었습니다.', 'success');
        } else {
            this.data.addEquipment(data);
            this.showToast('설비가 추가되었습니다.', 'success');
        }

        this.closeModal('equipmentModal');
        this.renderEquipmentGrid();
        this.renderDashboard();
    }

    deleteEquipment(id) {
        if (confirm('이 설비를 삭제하시겠습니까? 관련된 모든 이력과 일정도 함께 삭제됩니다.')) {
            this.data.deleteEquipment(id);
            this.showToast('설비가 삭제되었습니다.', 'success');
            this.renderEquipmentGrid();
            this.renderDashboard();
        }
    }

    openEquipmentDetail(id) {
        const eq = this.data.getEquipmentById(id);
        if (!eq) return;

        const histories = this.data.getHistoriesByEquipment(id);

        document.getElementById('equipmentDetailTitle').textContent = eq.name;
        document.getElementById('equipmentDetailContent').innerHTML = `
            <div class="detail-grid">
                <div class="detail-section">
                    <h3><i class="fas fa-info-circle"></i> 기본 정보</h3>
                    <div class="detail-row"><label>관리번호</label><span>${eq.code}</span></div>
                    <div class="detail-row"><label>설비 유형</label><span>${eq.type}</span></div>
                    <div class="detail-row"><label>정격하중</label><span>${eq.capacity ? eq.capacity + ' 톤' : '-'}</span></div>
                    <div class="detail-row"><label>상태</label><span class="status-badge status-${eq.status}">${eq.status}</span></div>
                </div>
                <div class="detail-section">
                    <h3><i class="fas fa-map-marker-alt"></i> 설치 정보</h3>
                    <div class="detail-row"><label>설치 위치</label><span>${eq.location}</span></div>
                    <div class="detail-row"><label>제조사</label><span>${eq.manufacturer || '-'}</span></div>
                    <div class="detail-row"><label>설치일</label><span>${eq.installDate ? this.formatDate(eq.installDate) : '-'}</span></div>
                    <div class="detail-row"><label>다음 점검</label><span>${eq.nextInspection ? this.formatDate(eq.nextInspection) : '-'}</span></div>
                </div>
                <div class="detail-section full-width">
                    <h3><i class="fas fa-history"></i> 최근 이력</h3>
                    ${histories.length > 0 ? `
                        <div class="history-timeline">
                            ${histories.slice(0, 5).map(h => `
                                <div class="timeline-item">
                                    <div class="timeline-date">${this.formatDate(h.date)}</div>
                                    <div class="timeline-content">
                                        <h4>${h.type} - <span class="result-badge result-${h.result}">${h.result}</span></h4>
                                        <p>${h.description}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-secondary">이력이 없습니다.</p>'}
                </div>
            </div>
        `;

        this.openModal('equipmentDetailModal');
    }

    // 이력 CRUD
    openHistoryModal(id = null) {
        const form = document.getElementById('historyForm');
        form.reset();
        document.getElementById('historyId').value = '';
        document.getElementById('historyModalTitle').textContent = '이력 추가';
        document.getElementById('historyDate').value = new Date().toISOString().split('T')[0];

        this.populateEquipmentFilter('historyEquipment');

        if (id) {
            const h = this.data.histories.find(h => h.id === id);
            if (h) {
                document.getElementById('historyId').value = h.id;
                document.getElementById('historyEquipment').value = h.equipmentId;
                document.getElementById('historyDate').value = h.date;
                document.getElementById('historyType').value = h.type;
                document.getElementById('historyTechnician').value = h.technician;
                document.getElementById('historyResult').value = h.result;
                document.getElementById('historyCost').value = h.cost || '';
                document.getElementById('historyDescription').value = h.description;
                document.getElementById('historyModalTitle').textContent = '이력 수정';
            }
        }
        this.openModal('historyModal');
    }

    handleHistorySubmit(e) {
        e.preventDefault();
        const id = document.getElementById('historyId').value;
        const data = {
            equipmentId: parseInt(document.getElementById('historyEquipment').value),
            date: document.getElementById('historyDate').value,
            type: document.getElementById('historyType').value,
            technician: document.getElementById('historyTechnician').value,
            result: document.getElementById('historyResult').value,
            cost: parseFloat(document.getElementById('historyCost').value) || 0,
            description: document.getElementById('historyDescription').value
        };

        if (id) {
            this.data.updateHistory(parseInt(id), data);
            this.showToast('이력이 수정되었습니다.', 'success');
        } else {
            this.data.addHistory(data);
            this.showToast('이력이 추가되었습니다.', 'success');
        }

        this.closeModal('historyModal');
        this.renderHistoryTable();
        this.renderDashboard();
    }

    deleteHistory(id) {
        if (confirm('이 이력을 삭제하시겠습니까?')) {
            this.data.deleteHistory(id);
            this.showToast('이력이 삭제되었습니다.', 'success');
            this.renderHistoryTable();
        }
    }

    // 일정 CRUD
    openScheduleModal(id = null) {
        const form = document.getElementById('scheduleForm');
        form.reset();
        document.getElementById('scheduleId').value = '';

        this.populateEquipmentFilter('scheduleEquipment');

        if (id) {
            const s = this.data.schedules.find(s => s.id === id);
            if (s) {
                document.getElementById('scheduleId').value = s.id;
                document.getElementById('scheduleEquipment').value = s.equipmentId;
                document.getElementById('scheduleDate').value = s.date;
                document.getElementById('scheduleType').value = s.type;
                document.getElementById('scheduleTechnician').value = s.technician || '';
                document.getElementById('scheduleNotes').value = s.notes || '';
            }
        }
        this.openModal('scheduleModal');
    }

    handleScheduleSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('scheduleId').value;
        const data = {
            equipmentId: parseInt(document.getElementById('scheduleEquipment').value),
            date: document.getElementById('scheduleDate').value,
            type: document.getElementById('scheduleType').value,
            technician: document.getElementById('scheduleTechnician').value,
            notes: document.getElementById('scheduleNotes').value
        };

        if (id) {
            this.data.updateSchedule(parseInt(id), data);
            this.showToast('일정이 수정되었습니다.', 'success');
        } else {
            this.data.addSchedule(data);
            this.showToast('일정이 추가되었습니다.', 'success');
        }

        this.closeModal('scheduleModal');
        this.renderCalendar();
        this.renderDashboard();
    }

    // 보고서 기능
    generateMonthlyReport() {
        const month = document.getElementById('monthlyReportMonth').value;
        if (!month) { this.showToast('월을 선택해주세요.', 'warning'); return; }

        const histories = this.data.histories.filter(h => h.date.startsWith(month));
        let report = `월간 점검 보고서 (${month})\n${'='.repeat(50)}\n\n`;
        report += `총 점검 건수: ${histories.length}건\n\n`;

        histories.forEach(h => {
            const eq = this.data.getEquipmentById(h.equipmentId);
            report += `날짜: ${h.date}\n설비: ${eq ? eq.name : '알 수 없음'}\n유형: ${h.type}\n담당자: ${h.technician}\n결과: ${h.result}\n내용: ${h.description}\n${'─'.repeat(30)}\n`;
        });

        this.downloadFile(`월간보고서_${month}.txt`, report);
        this.showToast('보고서가 생성되었습니다.', 'success');
    }

    generateEquipmentReport() {
        const eqId = document.getElementById('equipmentReportSelect').value;
        if (!eqId) { this.showToast('설비를 선택해주세요.', 'warning'); return; }

        const eq = this.data.getEquipmentById(parseInt(eqId));
        const histories = this.data.getHistoriesByEquipment(parseInt(eqId));

        let report = `설비별 이력 보고서\n${'='.repeat(50)}\n\n`;
        report += `설비명: ${eq.name}\n관리번호: ${eq.code}\n유형: ${eq.type}\n설치위치: ${eq.location}\n상태: ${eq.status}\n\n`;
        report += `총 이력 건수: ${histories.length}건\n${'─'.repeat(50)}\n\n`;

        histories.forEach(h => {
            report += `날짜: ${h.date}\n유형: ${h.type}\n담당자: ${h.technician}\n결과: ${h.result}\n내용: ${h.description}\n비용: ${h.cost ? h.cost.toLocaleString() + '원' : '-'}\n${'─'.repeat(30)}\n`;
        });

        this.downloadFile(`설비이력_${eq.name}.txt`, report);
        this.showToast('보고서가 생성되었습니다.', 'success');
    }

    exportData() {
        const data = this.data.exportData();
        this.downloadFile('크레인이력관리_백업.json', data);
        this.showToast('데이터가 내보내기 되었습니다.', 'success');
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (this.data.importData(e.target.result)) {
                this.showToast('데이터가 가져오기 되었습니다.', 'success');
                this.renderDashboard();
            } else {
                this.showToast('데이터 가져오기 실패', 'error');
            }
        };
        reader.readAsText(file);
    }

    async reloadExcelData() {
        if (!confirm('엑셀 파일에서 데이터를 다시 불러옵니다.\n기존 데이터가 덮어쓰기됩니다. 계속하시겠습니까?')) {
            return;
        }

        this.showToast('엑셀 데이터 로딩 중...', 'info');

        const loaded = await this.data.reloadFromExcel();

        if (loaded) {
            this.showToast(`${this.data.equipments.length}개 설비, ${this.data.histories.length}개 이력 로드 완료`, 'success');
            this.renderDashboard();
            this.navigateTo('dashboard');
        } else {
            this.showToast('엑셀 데이터 로드 실패. crane_data.json 파일을 확인하세요.', 'error');
        }
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 앱 초기화
let app;
(async () => {
    app = new CraneApp();
    await app.init();
})();
