/**
 * 싸이월드 추억 앨범 웹앱
 * 순수 JavaScript로 구현된 추억 앨범 관리 시스템
 */

// 전역 상태 관리
const AppState = {
    // 앱 데이터
    photos: [],
    guestbook: [],
    profile: {
        name: '',
        intro: '',
        image: null
    },
    theme: 'pastel',
    bgm_url: '',
    
    // UI 상태
    current_tab: 'album',
    sort_by: 'date-desc',
    filter_sticker: '',
    
    // 초기화
    init() {
        this.load_from_storage();
        this.setup_event_listeners();
        this.render_all();
    },
    
    // localStorage에서 데이터 로드
    load_from_storage() {
        try {
            const saved_data = localStorage.getItem('cyworld_album_data');
            if (saved_data) {
                const data = JSON.parse(saved_data);
                this.photos = data.photos || [];
                this.guestbook = data.guestbook || [];
                this.profile = data.profile || { name: '', intro: '', image: null };
                this.theme = data.theme || 'pastel';
                this.bgm_url = data.bgm_url || '';
            }
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            this.show_notification('데이터 로드에 실패했습니다.', 'error');
        }
    },
    
    // localStorage에 데이터 저장
    save_to_storage() {
        try {
            const data = {
                photos: this.photos,
                guestbook: this.guestbook,
                profile: this.profile,
                theme: this.theme,
                bgm_url: this.bgm_url
            };
            localStorage.setItem('cyworld_album_data', JSON.stringify(data));
        } catch (error) {
            console.error('데이터 저장 실패:', error);
            this.show_notification('데이터 저장에 실패했습니다.', 'error');
        }
    },
    
    // 이벤트 리스너 설정
    setup_event_listeners() {
        // 탭 전환
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switch_tab(e.target.dataset.tab);
            });
        });
        
        // 테마 변경
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.change_theme(e.target.dataset.theme);
            });
        });
        
        // 프로필 이미지 변경
        document.getElementById('change-profile-image').addEventListener('click', () => {
            document.getElementById('profile-image-input').click();
        });
        
        document.getElementById('profile-image-input').addEventListener('change', (e) => {
            this.handle_profile_image_change(e);
        });
        
        // 프로필 정보 저장
        document.getElementById('profile-name').addEventListener('input', (e) => {
            this.profile.name = e.target.value;
            this.save_to_storage();
        });
        
        document.getElementById('profile-intro').addEventListener('input', (e) => {
            this.profile.intro = e.target.value;
            this.save_to_storage();
        });
        
        // 사진 업로드
        document.getElementById('select-photos').addEventListener('click', () => {
            document.getElementById('photo-input').click();
        });
        
        document.getElementById('photo-input').addEventListener('change', (e) => {
            this.handle_photo_upload(e);
        });
        
        // 드래그 앤 드롭
        const upload_area = document.getElementById('upload-area');
        upload_area.addEventListener('dragover', (e) => {
            e.preventDefault();
            upload_area.classList.add('dragover');
        });
        
        upload_area.addEventListener('dragleave', () => {
            upload_area.classList.remove('dragover');
        });
        
        upload_area.addEventListener('drop', (e) => {
            e.preventDefault();
            upload_area.classList.remove('dragover');
            this.handle_photo_upload({ target: { files: e.dataTransfer.files } });
        });
        
        // BGM 설정
        document.getElementById('apply-bgm').addEventListener('click', () => {
            this.apply_bgm();
        });
        
        // 정렬/필터
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.sort_by = e.target.value;
            this.render_album();
        });
        
        document.getElementById('filter-sticker').addEventListener('change', (e) => {
            this.filter_sticker = e.target.value;
            this.render_album();
        });
        
        // 방명록
        document.getElementById('add-guest-message').addEventListener('click', () => {
            this.add_guest_message();
        });
        
        // 데이터 관리
        document.getElementById('export-data').addEventListener('click', () => {
            this.export_data();
        });
        
        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.import_data(e);
        });
        
        document.getElementById('reset-data').addEventListener('click', () => {
            this.reset_data();
        });
        
        // 모달 닫기
        document.querySelector('.close').addEventListener('click', () => {
            this.close_modal();
        });
        
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.close_modal();
            }
        });
    },
    
    // 탭 전환
    switch_tab(tab_name) {
        // 모든 탭 버튼과 패널 비활성화
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        
        // 선택된 탭 활성화
        document.querySelector(`[data-tab="${tab_name}"]`).classList.add('active');
        document.getElementById(`${tab_name}-tab`).classList.add('active');
        
        this.current_tab = tab_name;
        
        // 탭별 특별 처리
        if (tab_name === 'album') {
            this.render_album();
        } else if (tab_name === 'upload') {
            this.render_upload_preview();
        } else if (tab_name === 'guestbook') {
            this.render_guestbook();
        }
    },
    
    // 테마 변경
    change_theme(theme_name) {
        this.theme = theme_name;
        document.documentElement.setAttribute('data-theme', theme_name);
        
        // 테마 버튼 활성화 상태 업데이트
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-theme="${theme_name}"]`).classList.add('active');
        
        this.save_to_storage();
        this.show_notification(`${theme_name} 테마로 변경되었습니다.`);
    },
    
    // 프로필 이미지 변경 처리
    handle_profile_image_change(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.profile.image = event.target.result;
                document.getElementById('profile-image').src = event.target.result;
                this.save_to_storage();
                this.show_notification('프로필 이미지가 변경되었습니다.');
            };
            reader.readAsDataURL(file);
        }
    },
    
    // 사진 업로드 처리
    handle_photo_upload(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        let processed_count = 0;
        const total_files = files.length;
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const photo_data = {
                        id: Date.now() + Math.random(),
                        image: event.target.result,
                        title: file.name.split('.')[0],
                        description: '',
                        date: new Date().toISOString().split('T')[0],
                        stickers: [],
                        created_at: new Date().toISOString()
                    };
                    
                    this.photos.push(photo_data);
                    processed_count++;
                    
                    if (processed_count === total_files) {
                        this.save_to_storage();
                        this.render_album();
                        this.render_upload_preview();
                        this.show_notification(`${total_files}장의 사진이 업로드되었습니다.`);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                this.show_notification(`${file.name}은(는) 지원되지 않는 파일 형식입니다.`, 'error');
            }
        });
    },
    
    // BGM 적용
    apply_bgm() {
        const url = document.getElementById('bgm-url').value.trim();
        this.bgm_url = url;
        
        if (url) {
            // 유튜브 URL을 임베드 URL로 변환
            const video_id = this.extract_youtube_id(url);
            if (video_id) {
                const embed_url = `https://www.youtube.com/embed/${video_id}?autoplay=1&loop=1&playlist=${video_id}`;
                document.getElementById('bgm-iframe').src = embed_url;
                document.getElementById('bgm-player').style.display = 'block';
                this.show_notification('BGM이 적용되었습니다.');
            } else {
                this.show_notification('유효한 유튜브 URL이 아닙니다.', 'error');
            }
        } else {
            document.getElementById('bgm-player').style.display = 'none';
            this.show_notification('BGM이 제거되었습니다.');
        }
        
        this.save_to_storage();
    },
    
    // 유튜브 ID 추출
    extract_youtube_id(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    },
    
    // 방명록 메시지 추가
    add_guest_message() {
        const name = document.getElementById('guest-name').value.trim();
        const message = document.getElementById('guest-message').value.trim();
        
        if (!name || !message) {
            this.show_notification('닉네임과 메시지를 모두 입력해주세요.', 'error');
            return;
        }
        
        const guest_message = {
            id: Date.now(),
            name: name,
            message: message,
            created_at: new Date().toISOString()
        };
        
        this.guestbook.push(guest_message);
        this.save_to_storage();
        this.render_guestbook();
        
        // 입력 필드 초기화
        document.getElementById('guest-name').value = '';
        document.getElementById('guest-message').value = '';
        
        this.show_notification('방명록이 등록되었습니다.');
    },
    
    // 방명록 메시지 삭제
    delete_guest_message(id) {
        this.guestbook = this.guestbook.filter(item => item.id !== id);
        this.save_to_storage();
        this.render_guestbook();
        this.show_notification('방명록이 삭제되었습니다.');
    },
    
    // 사진에 스티커 추가/제거
    toggle_sticker(photo_id, sticker) {
        const photo = this.photos.find(p => p.id === photo_id);
        if (photo) {
            const sticker_index = photo.stickers.indexOf(sticker);
            if (sticker_index > -1) {
                photo.stickers.splice(sticker_index, 1);
            } else {
                photo.stickers.push(sticker);
            }
            this.save_to_storage();
            this.render_album();
        }
    },
    
    // 사진 삭제
    delete_photo(photo_id) {
        if (confirm('이 사진을 삭제하시겠습니까?')) {
            this.photos = this.photos.filter(p => p.id !== photo_id);
            this.save_to_storage();
            this.render_album();
            this.show_notification('사진이 삭제되었습니다.');
        }
    },
    
    // 데이터 내보내기
    export_data() {
        try {
            const data = {
                photos: this.photos,
                guestbook: this.guestbook,
                profile: this.profile,
                theme: this.theme,
                bgm_url: this.bgm_url,
                export_date: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cyworld_album_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.show_notification('데이터가 내보내기되었습니다.');
        } catch (error) {
            console.error('데이터 내보내기 실패:', error);
            this.show_notification('데이터 내보내기에 실패했습니다.', 'error');
        }
    },
    
    // 데이터 불러오기
    import_data(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                // 데이터 검증
                if (!this.validate_import_data(data)) {
                    this.show_notification('유효하지 않은 데이터 파일입니다.', 'error');
                    return;
                }
                
                if (confirm('기존 데이터가 모두 삭제됩니다. 계속하시겠습니까?')) {
                    this.photos = data.photos || [];
                    this.guestbook = data.guestbook || [];
                    this.profile = data.profile || { name: '', intro: '', image: null };
                    this.theme = data.theme || 'pastel';
                    this.bgm_url = data.bgm_url || '';
                    
                    this.save_to_storage();
                    this.render_all();
                    this.show_notification('데이터가 성공적으로 불러와졌습니다.');
                }
            } catch (error) {
                console.error('데이터 불러오기 실패:', error);
                this.show_notification('데이터 불러오기에 실패했습니다.', 'error');
            }
        };
        reader.readAsText(file);
        
        // 파일 입력 초기화
        e.target.value = '';
    },
    
    // 데이터 검증
    validate_import_data(data) {
        return data && 
               Array.isArray(data.photos) && 
               Array.isArray(data.guestbook) && 
               typeof data.profile === 'object';
    },
    
    // 데이터 초기화
    reset_data() {
        if (confirm('모든 데이터가 삭제됩니다. 정말로 초기화하시겠습니까?')) {
            this.photos = [];
            this.guestbook = [];
            this.profile = { name: '', intro: '', image: null };
            this.theme = 'pastel';
            this.bgm_url = '';
            
            localStorage.removeItem('cyworld_album_data');
            this.render_all();
            this.show_notification('데이터가 초기화되었습니다.');
        }
    },
    
    // 앨범 렌더링
    render_album() {
        const container = document.getElementById('album-grid');
        const empty_state = document.getElementById('empty-album');
        const photo_count = document.getElementById('photo-count');
        
        // 필터링 및 정렬
        let filtered_photos = [...this.photos];
        
        // 스티커 필터
        if (this.filter_sticker) {
            filtered_photos = filtered_photos.filter(photo => 
                photo.stickers.includes(this.filter_sticker)
            );
        }
        
        // 정렬
        filtered_photos.sort((a, b) => {
            switch (this.sort_by) {
                case 'date-desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'date-asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'sticker':
                    return b.stickers.length - a.stickers.length;
                default:
                    return 0;
            }
        });
        
        // 사진 수 업데이트
        photo_count.textContent = filtered_photos.length;
        
        // 빈 상태 표시
        if (filtered_photos.length === 0) {
            container.innerHTML = '';
            empty_state.style.display = 'block';
            return;
        }
        
        empty_state.style.display = 'none';
        
        // 사진 카드 렌더링
        container.innerHTML = filtered_photos.map(photo => `
            <div class="photo-card" data-photo-id="${photo.id}">
                <img src="${photo.image}" alt="${photo.title}" onclick="AppState.show_photo_modal('${photo.id}')">
                <div class="photo-title">${photo.title}</div>
                <div class="photo-description">${photo.description}</div>
                <div class="photo-meta">
                    <div class="photo-date">${this.format_date(photo.date)}</div>
                    <div class="photo-stickers">
                        ${['💖', '⭐', '🎵', '📸', '🌙'].map(sticker => 
                            `<span class="sticker ${photo.stickers.includes(sticker) ? 'active' : ''}" 
                                   onclick="AppState.toggle_sticker('${photo.id}', '${sticker}')">${sticker}</span>`
                        ).join('')}
                    </div>
                </div>
                <button class="delete-btn" onclick="AppState.delete_photo('${photo.id}')" title="삭제">×</button>
            </div>
        `).join('');
    },
    
    // 업로드 미리보기 렌더링
    render_upload_preview() {
        const container = document.getElementById('upload-preview');
        const recent_photos = this.photos.slice(-5); // 최근 5장만 표시
        
        if (recent_photos.length === 0) {
            container.innerHTML = '<p>업로드된 사진이 없습니다.</p>';
            return;
        }
        
        container.innerHTML = recent_photos.map(photo => `
            <div class="upload-preview-item">
                <img src="${photo.image}" alt="${photo.title}">
                <div class="photo-title">${photo.title}</div>
                <div class="photo-date">${this.format_date(photo.date)}</div>
            </div>
        `).join('');
    },
    
    // 방명록 렌더링
    render_guestbook() {
        const container = document.getElementById('guestbook-list');
        
        if (this.guestbook.length === 0) {
            container.innerHTML = '<p>아직 방명록이 없습니다. 첫 번째 메시지를 남겨보세요!</p>';
            return;
        }
        
        container.innerHTML = this.guestbook.map(item => `
            <div class="guestbook-item">
                <div class="guest-name">${item.name}</div>
                <div class="guest-message">${item.message}</div>
                <button class="delete-btn" onclick="AppState.delete_guest_message(${item.id})" title="삭제">×</button>
            </div>
        `).join('');
    },
    
    // 전체 렌더링
    render_all() {
        // 프로필 정보 업데이트
        document.getElementById('profile-name').value = this.profile.name;
        document.getElementById('profile-intro').value = this.profile.intro;
        if (this.profile.image) {
            document.getElementById('profile-image').src = this.profile.image;
        }
        
        // 테마 적용
        document.documentElement.setAttribute('data-theme', this.theme);
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-theme="${this.theme}"]`).classList.add('active');
        
        // BGM URL 설정
        document.getElementById('bgm-url').value = this.bgm_url;
        if (this.bgm_url) {
            this.apply_bgm();
        }
        
        // 정렬/필터 설정
        document.getElementById('sort-by').value = this.sort_by;
        document.getElementById('filter-sticker').value = this.filter_sticker;
        
        // 각 탭 렌더링
        this.render_album();
        this.render_upload_preview();
        this.render_guestbook();
    },
    
    // 사진 모달 표시
    show_photo_modal(photo_id) {
        const photo = this.photos.find(p => p.id === photo_id);
        if (!photo) return;
        
        const modal = document.getElementById('modal');
        const modal_body = document.getElementById('modal-body');
        
        modal_body.innerHTML = `
            <div style="text-align: center;">
                <img src="${photo.image}" alt="${photo.title}" style="max-width: 100%; max-height: 70vh; border-radius: 10px; margin-bottom: 20px;">
                <h3>${photo.title}</h3>
                <p>${photo.description}</p>
                <p><strong>촬영일:</strong> ${this.format_date(photo.date)}</p>
                <div style="margin-top: 15px;">
                    <strong>스티커:</strong> ${photo.stickers.join(' ')}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    },
    
    // 모달 닫기
    close_modal() {
        document.getElementById('modal').style.display = 'none';
    },
    
    // 날짜 포맷팅
    format_date(date_string) {
        const date = new Date(date_string);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // 알림 표시
    show_notification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
};

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
});
