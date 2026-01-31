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
            await this.loadFromJsonFile();
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
        // 가짜 데이터 생성하지 않음
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

        // 실시간 시계 시작
        setInterval(() => this.updateClock(), 1000);

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
        document.getElementById('closeHistoryModal').addEventListener('click', () => this.closeModal('historyModal'));
        document.getElementById('cancelHistory').addEventListener('click', () => this.closeModal('historyModal'));
        document.getElementById('historyForm').addEventListener('submit', (e) => this.handleHistorySubmit(e));

        // 부품 교체 추가/수정
        document.getElementById('closePartReplacementModal').addEventListener('click', () => this.closeModal('partReplacementModal'));
        document.getElementById('cancelPartReplacement').addEventListener('click', () => this.closeModal('partReplacementModal'));
        document.getElementById('partReplacementForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePartReplacement();
        });

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
        document.getElementById('historySearchInput').addEventListener('input', () => this.renderCurrentHistoryTab());
        // 이력 필터는 onchange 속성으로 처리됨

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

        // 모바일 사이드바 토글
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('active');
            });
        }

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

    // 실시간 시계 업데이트
    updateClock() {
        const now = new Date();
        const timeEl = document.getElementById('dashboardTime');
        const dateEl = document.getElementById('dashboardDate');

        if (timeEl && dateEl) {
            timeEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false }); // 24시간제
            const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            dateEl.textContent = now.toLocaleDateString('ko-KR', options);
        }
    }

    calculateStats() {
        const total = this.data.equipments.length;
        const normal = this.data.equipments.filter(e => e.status === '정상').length;
        const maintenance = this.data.equipments.filter(e => e.status === '점검중').length;
        const issue = this.data.equipments.filter(e => e.status === '수리필요' || e.status === '가동중지').length;

        const availability = total > 0 ? ((normal / total) * 100).toFixed(1) : '0.0';
        const maintenanceRate = total > 0 ? ((maintenance / total) * 100).toFixed(1) : '0.0';
        const issueRate = total > 0 ? ((issue / total) * 100).toFixed(1) : '0.0';

        return { total, normal, maintenance, issue, availability, maintenanceRate, issueRate };
    }

    // 대시보드 렌더링 (새로운 디자인)
    renderDashboard() {
        const stats = this.calculateStats();
        const container = document.getElementById('dashboardPage');

        container.innerHTML = `
            <div class="dashboard-container">
                <!-- 상단 헤더 섹션 -->
                <div class="dashboard-header-section">
                    <div class="clock-card">
                        <div class="current-time" id="dashboardTime">--:--:--</div>
                        <div class="current-date" id="dashboardDate">----. --. --.</div>
                    </div>
                    
                    <div class="kpi-grid">
                        <div class="kpi-card kpi-total">
                            <h4>총 설비 <i class="fas fa-cube"></i></h4>
                            <div class="kpi-value">${stats.total}</div>
                            <div class="kpi-sub">Total Assets</div>
                        </div>
                        <div class="kpi-card kpi-normal">
                            <h4>정상 가동 <i class="fas fa-check-circle"></i></h4>
                            <div class="kpi-value">${stats.normal}</div>
                            <div class="kpi-sub" style="color:var(--success)">${stats.availability}% 가동률</div>
                        </div>
                        <div class="kpi-card kpi-warning">
                            <h4>점검 진행 <i class="fas fa-tools"></i></h4>
                            <div class="kpi-value">${stats.maintenance}</div>
                            <div class="kpi-sub" style="color:var(--warning)">${stats.maintenanceRate}% 진행중</div>
                        </div>
                        <div class="kpi-card kpi-danger">
                            <h4>수리/조치 <i class="fas fa-exclamation-triangle"></i></h4>
                            <div class="kpi-value">${stats.issue}</div>
                            <div class="kpi-sub" style="color:var(--danger)">${stats.issueRate}% 이상발생</div>
                        </div>
                    </div>
                </div>

                <!-- 차트 섹션 -->
                <div class="chart-section">
                    <div class="chart-card">
                        <div class="chart-header"><h3>설비 가동 효율 (Availability)</h3></div>
                        <div class="donut-chart-wrapper">
                            <div class="donut-chart" style="background: conic-gradient(var(--primary) 0% ${stats.availability}%, var(--bg-card) ${stats.availability}% 100%);"></div>
                            <div class="donut-hole">
                                <div class="donut-value">${stats.availability}%</div>
                                <div class="donut-label">가동률</div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header"><h3>점검/유지보수 (Maintenance)</h3></div>
                         <div class="donut-chart-wrapper">
                            <div class="donut-chart" style="background: conic-gradient(var(--warning) 0% ${stats.maintenanceRate}%, var(--bg-card) ${stats.maintenanceRate}% 100%);"></div>
                            <div class="donut-hole">
                                <div class="donut-value">${stats.maintenanceRate}%</div>
                                <div class="donut-label">진행률</div>
                            </div>
                        </div>
                    </div>
                     <div class="chart-card">
                        <div class="chart-header"><h3>무재해일 카운트 (Safety)</h3></div>
                         <div class="donut-chart-wrapper">
                            <div class="donut-chart" style="background: conic-gradient(var(--success) 0% 100%, var(--bg-card) 100% 100%);"></div>
                            <div class="donut-hole">
                                <div class="donut-value" style="color:var(--success)">-</div>
                                <div class="donut-label">일</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 설비 현황 보드 -->
                 <h3 style="margin-bottom:10px; border-left:4px solid var(--info); padding-left:10px; color:var(--text-primary);">실시간 설비 현황</h3>
                 <div class="status-board-grid" id="statusBoardGrid"></div>
            </div>
        `;

        this.updateClock();
        this.renderStatusBoard();
    }

    renderStatusBoard() {
        const container = document.getElementById('statusBoardGrid');

        container.innerHTML = this.data.equipments.map(eq => {
            let statusClass = 'indicator-inactive';
            let statusText = eq.status;

            if (eq.status === '정상') { statusClass = 'indicator-정상'; }
            else if (eq.status === '점검중') { statusClass = 'indicator-점검중'; }
            else if (eq.status === '수리필요' || eq.status === '가동중지') { statusClass = 'indicator-수리필요'; }

            return `
                <div class="status-card" onclick="app.openEquipmentDetail(${eq.id})" style="min-height: auto; padding: 20px;">
                    <div class="status-card-header" style="display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                            <span class="status-indicator ${statusClass}" style="font-size: 0.75rem;">${statusText}</span>
                            <span style="font-size:0.9rem; font-weight:700; color:var(--primary-light); letter-spacing:0.5px;">${eq.code}</span>
                        </div>
                        <h4 style="font-size:1.1rem; margin:0; color:var(--text-primary);">${eq.name}</h4>
                        <div style="font-size:0.85rem; color:var(--text-secondary); display:flex; gap:10px; width:100%; margin-top:4px;">
                            <span>${eq.location}</span>
                            <span style="margin-left:auto;">${eq.manufacturer || ''}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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
                        <h3>#${eq.code}</h3>
                        <p>${eq.name} | ${eq.type}</p>
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
    // 이력 페이지 렌더링
    renderHistoryPage() {
        this.populateEquipmentFilter('historyEquipmentFilter');
        if (!this.currentHistoryTab) this.currentHistoryTab = 'general';
        this.switchHistoryTab(this.currentHistoryTab);
    }

    switchHistoryTab(tabName) {
        this.currentHistoryTab = tabName;

        const generalBtn = document.querySelector('.tab-btn:first-child');
        const partsBtn = document.querySelector('.tab-btn:last-child');

        if (tabName === 'general') {
            generalBtn.classList.add('active');
            partsBtn.classList.remove('active');
            document.getElementById('generalHistoryTab').style.display = 'block';
            document.getElementById('partsHistoryTab').style.display = 'none';
        } else {
            generalBtn.classList.remove('active');
            partsBtn.classList.add('active');
            document.getElementById('generalHistoryTab').style.display = 'none';
            document.getElementById('partsHistoryTab').style.display = 'block';
        }

        this.renderCurrentHistoryTab();
    }

    renderCurrentHistoryTab() {
        if (this.currentHistoryTab === 'general') {
            this.renderGeneralHistoryTable();
        } else {
            this.renderPartsReplacementTable();
        }
    }

    renderGeneralHistoryTable() {
        // 기존 renderHistoryTable 로직 변형
        const container = document.getElementById('historyTableBody');
        let histories = [...this.data.histories];

        const equipmentFilter = document.getElementById('historyEquipmentFilter').value;
        const monthFilter = document.getElementById('historyMonthFilter').value;
        const searchQuery = document.getElementById('historySearchInput').value.toLowerCase();

        // 1. 점검/보수 탭이므로 '부품교체'는 제외
        histories = histories.filter(h => h.type !== '부품교체');

        if (equipmentFilter) histories = histories.filter(h => h.equipmentId === parseInt(equipmentFilter));
        if (monthFilter) histories = histories.filter(h => h.date.startsWith(monthFilter));
        if (searchQuery) histories = histories.filter(h => h.description.toLowerCase().includes(searchQuery) || (h.technician && h.technician.toLowerCase().includes(searchQuery)));

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
                     <td>${equipment ? '#' + equipment.code : '알 수 없음'}</td>
                     <td>${h.type}</td>
                     <td>${h.technician}</td>
                     <td>${h.description}</td>
                     <td><span class="result-badge result-${h.result}">${h.result}</span></td>
                     <td class="action-btns">
                         <button class="btn btn-secondary btn-sm" onclick="app.openHistoryModal(${h.id})"><i class="fas fa-edit"></i></button>
                     </td>
                 </tr>
             `;
        }).join('');
    }

    renderPartsReplacementTable() {
        // 부품 교체 이력만 표시
        const container = document.getElementById('partsReplacementTableBody');
        let histories = [...this.data.histories].filter(h => h.type === '부품교체');

        const equipmentFilter = document.getElementById('historyEquipmentFilter').value;
        const monthFilter = document.getElementById('historyMonthFilter').value;
        const searchQuery = document.getElementById('historySearchInput').value.toLowerCase();

        if (equipmentFilter) histories = histories.filter(h => h.equipmentId === parseInt(equipmentFilter));
        if (monthFilter) histories = histories.filter(h => h.date.startsWith(monthFilter));
        if (searchQuery) histories = histories.filter(h => h.description.toLowerCase().includes(searchQuery));

        histories.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (histories.length === 0) {
            container.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-cogs"></i><p>부품 교체 이력이 없습니다.</p></td></tr>';
            return;
        }

        container.innerHTML = histories.map(h => {
            const equipment = this.data.getEquipmentById(h.equipmentId);
            let details = {};
            try {
                details = JSON.parse(h.notes);
            } catch (e) {
                // 기존 데이터 호환
                details = { partName: h.description, partModel: '-', quantity: '-', reason: '-' };
            }

            return `
                <tr>
                    <td>${this.formatDate(h.date)}</td>
                    <td>${equipment ? '#' + equipment.code : '알 수 없음'}</td>
                    <td>${details.partName || '-'}</td>
                    <td>${details.partModel || '-'}</td>
                    <td>${details.quantity || '-'}</td>
                    <td>${details.reason || details.partReason || '-'}</td>
                    <td class="action-btns">
                        <button class="btn btn-secondary btn-sm" onclick="app.openPartReplacementModal(${h.id})"><i class="fas fa-edit"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openPartReplacementModal(id = null) {
        this.populateEquipmentFilter('partEquipment');
        const modal = document.getElementById('partReplacementModal');
        const form = document.getElementById('partReplacementForm');
        document.getElementById('partReplacementId').value = id || '';
        document.getElementById('partReplacementModalTitle').textContent = id ? '부품 교체 기록 수정' : '부품 교체 기록 추가';

        if (id) {
            const history = this.data.histories.find(h => h.id === id);
            if (history) {
                document.getElementById('partEquipment').value = history.equipmentId;
                document.getElementById('partDate').value = history.date;

                let details = {};
                try { details = JSON.parse(history.notes); } catch (e) { }

                document.getElementById('partName').value = details.partName || '';
                document.getElementById('partModel').value = details.partModel || '';
                document.getElementById('partQuantity').value = details.quantity || 1;
                document.getElementById('partReason').value = details.reason || history.description || '';
                document.getElementById('partNextReplace').value = details.nextReplace || '';
                document.getElementById('partNotes').value = details.notes || '';
            }
        } else {
            form.reset();
            document.getElementById('partDate').value = new Date().toISOString().split('T')[0];
        }
        this.openModal('partReplacementModal');
    }

    savePartReplacement() {
        const id = document.getElementById('partReplacementId').value;
        const equipmentId = parseInt(document.getElementById('partEquipment').value);
        const date = document.getElementById('partDate').value;
        const partName = document.getElementById('partName').value;
        const partModel = document.getElementById('partModel').value;
        const quantity = document.getElementById('partQuantity').value;
        const reason = document.getElementById('partReason').value;
        const nextReplace = document.getElementById('partNextReplace').value;
        const notes = document.getElementById('partNotes').value;

        if (!equipmentId || !date || !partName || !reason) {
            this.showToast('필수 항목을 모두 입력해주세요.', 'error');
            return;
        }

        const details = { partName, partModel, quantity, reason, nextReplace, notes };

        const data = {
            equipmentId,
            date,
            type: '부품교체',
            technician: '담당자',
            description: `${partName} 교체 (${quantity}개)`,
            result: '양호',
            cost: 0,
            notes: JSON.stringify(details)
        };

        if (id) {
            this.data.updateHistory(parseInt(id), data);
            this.showToast('저장되었습니다.', 'success');
        } else {
            this.data.addHistory(data);
            this.showToast('저장되었습니다.', 'success');
        }
        this.closeModal('partReplacementModal');
        this.renderCurrentHistoryTab();
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
            const dayHistories = this.data.histories.filter(h => h.date === dateStr);
            const dayInspections = this.data.equipments.filter(e => e.nextInspectionDate === dateStr);

            let eventsHtml = '';

            daySchedules.forEach(s => {
                const eq = this.data.getEquipmentById(s.equipmentId);
                eventsHtml += `<div class="calendar-event event-schedule" onclick="app.openScheduleModal(${s.id})">
                    ${eq ? '#' + eq.code : ''} - ${s.type}
                </div>`;
            });

            dayHistories.forEach(h => {
                const eq = this.data.getEquipmentById(h.equipmentId);
                const isPart = h.type === '부품교체';
                const clickAction = isPart ? `app.openPartReplacementModal(${h.id})` : `app.openHistoryModal(${h.id})`;
                const className = isPart ? 'event-part' : 'event-history';
                eventsHtml += `<div class="calendar-event ${className}" onclick="${clickAction}">
                    ${eq ? '#' + eq.code : ''} - ${h.type}
                </div>`;
            });

            dayInspections.forEach(e => {
                eventsHtml += `<div class="calendar-event event-plan" onclick="app.showEquipmentDetail(${e.id})">
                     #${e.code} - 점검예정
                </div>`;
            });

            const hasEvents = eventsHtml.length > 0;

            html += `<div class="calendar-day${isToday ? ' today' : ''} ${hasEvents ? 'has-events' : ''}">
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-events">
                        ${eventsHtml}
                    </div>
                    ${hasEvents ? `
                        <div class="day-popup">
                            <div class="day-popup-header">${month + 1}월 ${day}일</div>
                            <div class="day-popup-content">${eventsHtml}</div>
                        </div>
                    ` : ''}
                </div>`;
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
            option.textContent = `#${eq.code} ${eq.name}`;
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

        document.getElementById('equipmentDetailTitle').textContent = eq.code ? '#' + eq.code : eq.name;
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
