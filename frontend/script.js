const API_URL = 'http://127.0.0.1:5001'; // Flask backend URL
const RANKING_SSE_URL = `${API_URL}/api/rankings/stream`;
const MAX_AVATAR_SIZE_MB = 2;
const MAX_SUBMISSION_SIZE_MB = 50;
const ALLOWED_AVATAR_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
const ALLOWED_SUBMISSION_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'webm', 'pdf', 'doc', 'docx'];
const AVATAR_UPLOAD_ENDPOINT = '/api/users/change-avatar';
const CHAT_HISTORY_KEY_PREFIX = 'chatbot_history_';
const CHAT_HISTORY_LENGTH = 20; // Max messages (10 pairs)

// --- Global State ---
let currentUser = null;
let courses = { instruments: [], martialArts: [] };
let personalCourseIds = [];
let rankings = [];
// Sử dụng biến khác để tránh xung đột với biến flashcardsData từ file flashcards.js
let appFlashcardsData = {};
let currentFlashcardCategory = 'sao';
let currentCardIndex = 0;
let knownFlashcards = {}; // Track cards marked as known
let currentSection = 'hero-section'; // Track current active section
let currentDailyChallenge = null;
let learningPathItems = [];
let currentMiniGame = null;
let userFeedbackList = [];
let userNotifications = []; // Store user notifications
let currentLanguage = 'vi';
let isSpeechEnabled = false;
let eventSourceRankings = null;
let recognition = null;
let isRecognizing = false;
let synthesis = window.speechSynthesis;
let chatbotHistory = [];
let rankingScrollInterval = null;
let teacherAnalytics = null;
let teacherStudents = [];
let lastRequestData = null; // Store last request data for mock responses
let hasUnreadNotifications = false; // Track if there are unread notifications

// Mini-game questions for different levels
const level1Questions = [
    { id: 'gn001', question: 'Nghe âm thanh và đoán nốt nhạc này là gì (tên đầy đủ)?', imageUrl: '/assets/images/games/note-do.png', audioUrl: '/assets/audio/notes/do.mp3', answer: ['đô'], points: 10 },
    { id: 'gn002', question: 'Nghe âm thanh và đoán nốt nhạc này?', imageUrl: '/assets/images/games/note-sol.png', audioUrl: '/assets/audio/notes/sol.mp3', answer: ['son', 'sol'], points: 10 },
    { id: 'gn003', question: 'Nghe âm thanh và đoán đây là nốt gì?', imageUrl: '/assets/images/games/note-mi.png', audioUrl: '/assets/audio/notes/mi.mp3', answer: ['mi'], points: 10 }
];

const level2Questions = [
    { id: 'ln001', question: 'Nghe âm thanh và đoán nốt nhạc này là gì?', audioUrl: '/assets/audio/notes/do.mp3', answer: ['đô'], points: 15, level: 2 },
    { id: 'ln002', question: 'Nghe âm thanh và đoán nốt nhạc này?', audioUrl: '/assets/audio/notes/sol.mp3', answer: ['son', 'sol'], points: 15, level: 2 },
    { id: 'ln003', question: 'Nghe âm thanh và đoán đây là nốt gì?', audioUrl: '/assets/audio/notes/mi.mp3', answer: ['mi'], points: 15, level: 2 }
];

const level3Questions = [
    { id: 'mn001', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/do.mp3', answer: ['Rê'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] },
    { id: 'mn002', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/sol.mp3', answer: ['Sol'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] },
    { id: 'mn003', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/mi.mp3', answer: ['Mi'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] },
    { id: 'mn004', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/do.mp3', answer: ['Rê'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] },
    { id: 'mn005', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/sol.mp3', answer: ['Sol'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] },
    { id: 'mn006', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/mi.mp3', answer: ['Mi'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] },
    { id: 'mn007', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/do.mp3', answer: ['Rê'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] },
    { id: 'mn008', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/sol.mp3', answer: ['Sol'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] },
    { id: 'mn009', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/mi.mp3', answer: ['Mi'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] },
    { id: 'mn010', question: 'Ghép Nốt Nhạc', audioUrl: '/assets/audio/notes/do.mp3', answer: ['Rê'], points: 20, level: 3, options: [{ label: 'Rê', imageUrl: '/assets/images/games/note-re.png' }, { label: 'Mi', imageUrl: '/assets/images/games/note-mi.png' }, { label: 'Sol', imageUrl: '/assets/images/games/note-sol.png' }, { label: 'La', imageUrl: '/assets/images/games/note-la.png' }] }
];

// Course avatars data for the application
// This file contains avatar URLs for courses in the exploration section
const courseAvatars = {
    // Sáo (Bamboo Flute) Courses
    "sao_truc_co_ban": {
        id: "sao_truc_co_ban",
        name: "Sáo Trúc Cơ Bản",
        avatar: "frontend/assets/images/avatars/sao.jpg"
    },
    "ky_thuat_lay_sao": {
        id: "ky_thuat_lay_sao",
        name: "Kỹ Thuật Láy Sáo",
        avatar: "./assets/images/avatars/sao_truc_ky_thuat.jpg"
    },

    // Đàn Tranh (Zither) Courses
    "dan_tranh_nhap_mon": {
        id: "dan_tranh_nhap_mon",
        name: "Đàn Tranh Nhập Môn",
        avatar: "./assets/images/avatars/dan_tranh.jpg"
    },
    "dan_tranh_nang_cao": {
        id: "dan_tranh_nang_cao",
        name: "Đàn Tranh Nâng Cao",
        avatar: "./assets/images/avatars/dan_tranh_nang_cao.jpg"
    },

    // Đàn Nguyệt (Moon Lute) Courses
    "dan_nguyet_co_ban": {
        id: "dan_nguyet_co_ban",
        name: "Đàn Nguyệt Cơ Bản",
        avatar: "./assets/images/avatars/dan_nguyet.jpg"
    },

    // Vovinam Courses
    "vovinam_can_ban": {
        id: "vovinam_can_ban",
        name: "Vovinam Căn Bản",
        avatar: "./assets/images/avatars/vovinam_basic.jpg"
    },
    "chien_luoc_vovinam": {
        id: "chien_luoc_vovinam",
        name: "Chiến Lược Vovinam",
        avatar: "./assets/images/avatars/vovinam_strategy.jpg"
    },
    "vovinam_nang_cao": {
        id: "vovinam_nang_cao",
        name: "Vovinam Nâng Cao",
        avatar: "./assets/images/avatars/vovinam_advanced.jpg"
    }
};

// Mini-game avatars data
const miniGameAvatars = {
    // Music note mini-game
    "music-note": {
        id: "music-note",
        name: "Đoán Nốt Nhạc",
        avatar: "/assets/images/games/music-note-bg.jpg"
    },
    "guess-note": {
        id: "guess-note",
        name: "Đoán Nốt Nhạc (Nhìn)",
        avatar: "/assets/images/games/music-note-bg.jpg"
    },
    "listen-note": {
        id: "listen-note",
        name: "Đoán Nốt Nhạc (Nghe)",
        avatar: "/assets/images/games/music-note-bg.jpg"
    },
    "match-note": {
        id: "match-note",
        name: "Đoán Nốt Nhạc (Ghép)",
        avatar: "/assets/images/games/music-note-bg.jpg"
    },

    // Vovinam mini-games
    "guess-pose": {
        id: "guess-pose",
        name: "Đoán Thế Võ",
        avatar: "/assets/images/games/vovinam-bg.jpg"
    },
    "guess-stance": {
        id: "guess-stance",
        name: "Đoán Thế Tấn",
        avatar: "/assets/images/games/stance-bg.jpg"
    }
};

// Function to get avatar URL by course title
function getCourseAvatarByTitle(title) {
    // Convert title to lowercase and replace spaces with underscores for matching
    const normalizedTitle = title.toLowerCase().replace(/\s+/g, '_');
    console.log('Normalized title:', normalizedTitle);

    // Log all available course IDs for debugging
    console.log('Available course IDs:', Object.keys(courseAvatars));

    // Direct matching based on title with absolute paths
    if (title.includes('Sáo Trúc Cơ Bản')) {
        return '/assets/images/avatars/sao.jpg';
    } else if (title.includes('Kỹ Thuật Láy Sáo')) {
        return '/assets/images/avatars/sao.jpg';
    } else if (title.includes('Đàn Tranh')) {
        return '/assets/images/avatars/dan_tranh.jpg';
    } else if (title.includes('Đàn Nguyệt')) {
        return '/assets/images/avatars/dan_nguyet.jpg';
    } else if (title.includes('Vovinam')) {
        return '/assets/images/avatars/vovinam.jpg';
    }

    // Find matching course by name (case-insensitive partial match)
    const course = Object.values(courseAvatars).find(c => {
        const idMatch = normalizedTitle.includes(c.id);
        const nameMatch = c.name.toLowerCase().includes(normalizedTitle);
        console.log(`Checking ${c.id}: idMatch=${idMatch}, nameMatch=${nameMatch}`);
        return idMatch || nameMatch;
    });

    console.log('Found course:', course);
    return course ? course.avatar : null;
}

// Function to get avatar URL by course ID
function getCourseAvatarById(id) {
    return courseAvatars[id] ? courseAvatars[id].avatar : null;
}

// Function to get mini-game avatar URL by game type
function getMiniGameAvatar(gameType) {
    return miniGameAvatars[gameType] ? miniGameAvatars[gameType].avatar : '/assets/images/games/default-game-bg.jpg';
}

// Khởi tạo dữ liệu flashcard từ file flashcards.js nếu có
document.addEventListener('DOMContentLoaded', function() {
    if (typeof flashcardsData !== 'undefined') {
        console.log('Loaded flashcards data from external file');
        window.flashcardsData = flashcardsData;
    } else {
        console.warn('External flashcards data not found, using empty object');
        window.flashcardsData = {};
    }

    // Khởi tạo flashcard nếu đang ở trang flashcard
    if (currentSection === 'flashcards') {
        renderFlashcardUI();
    }

    // Setup teacher challenge actions
    setupTeacherChallengeActions();
});

// --- Language Data (Keep your full data) ---
const languageData = {
    vi: {
        'loading': 'Đang tải...',
        'title': 'FPT Learning Hub',
        'explore': 'Khám phá',
        'activities': 'Hoạt động',
        'instruments': 'Nhạc cụ dân tộc',
        'martial-arts': 'Võ thuật',
        'flashcards': 'Ôn Tập Flashcard',
        'ranking': 'Xếp hạng',
        'challenges': 'Thử thách',
        'challenge': 'Thử thách hôm nay',
        'challenge-submission': 'Bài nộp thử thách',
        'practice': 'Bài tập thực hành',
        'mini-games': 'Mini-game',
        'teacher-dashboard': 'Bảng điều khiển GV',
        'feedback': 'Phản hồi',
        'search-placeholder': 'Tìm kiếm khóa học...',
        'toggle-theme': '🌞',
        'toggle-language': '🌐',
        'login': 'Đăng nhập',
        'signup': 'Đăng ký',
        'logout': '➡️',
        'profile': 'Hồ sơ',
        'hero-title': 'Học Vovinam & Nhạc Cụ Truyền Thống',
        'hero-desc': 'Khám phá văn hóa Việt qua các khóa học miễn phí.',
        'start-now': 'Bắt đầu ngay',
        'loading-courses': 'Đang tải khóa học...',
        'loading-profile': 'Đang tải hồ sơ...',
        'my-courses': 'Khóa Học Của Tôi',
        'no-personal-courses': 'Kéo khóa học vào đây hoặc thêm từ danh sách.',
        'learning-path': 'Lộ trình học tập',
        'loading-path': 'Đang tải lộ trình...',
        'no-learning-path': 'Chưa có lộ trình học tập.',
        'random-test': 'Kiểm tra ngẫu nhiên',
        'save-progress': 'Lưu tiến độ',
        'prev-card': 'Thẻ trước',
        'next-card': 'Thẻ sau',
        'test-now': 'Kiểm tra',
        'progress': 'Tiến độ',
        'points': 'Điểm thưởng',
        'submit-test': 'Nộp bài',
        'close': 'Đóng',
        'loading-flashcards': 'Đang tải flashcards...',
        'no-flashcards-category': 'Không có flashcard cho mục này.',
        'card-marked-known': 'Đã đánh dấu thẻ này là đã biết',
        'card-marked-unknown': 'Đã bỏ đánh dấu thẻ này',
        'cards-shuffled': 'Đã xáo trộn thẻ',
        'not-enough-cards-to-shuffle': 'Không đủ thẻ để xáo trộn',
        'shuffle': 'Xáo trộn',
        'mark-known': 'Đánh dấu đã biết',
        'marked-known': 'Đã biết',
        'loading-challenge': 'Đang tải thử thách...',
        'no-challenge-today': 'Hôm nay chưa có thử thách mới.',
        'submit-challenge': 'Nộp bài thử thách',
        'challenge-note-placeholder': 'Ghi chú (tùy chọn)...',
        'select-file': 'Chọn file (Ảnh/Video)',
        'guess-note': 'Đoán Nốt Nhạc',
        'guess-note-desc': 'Nhìn hình ảnh và đoán nốt nhạc.',
        'guess-pose': 'Đoán Thế Võ',
        'guess-pose-desc': 'Xem hình và đoán tên thế võ Vovinam.',
        'guess-stance': 'Đoán Thế Tấn',
        'guess-stance-desc': 'Nhận diện thế tấn Vovinam qua hình ảnh.',
        'listen-note': 'Nghe Đoán Nốt Nhạc',
        'listen-note-desc': 'Nghe âm thanh và đoán nốt nhạc chính xác.',
        'match-note': 'Ghép Nốt Nhạc',
        'match-note-desc': 'Nghe âm thanh và chọn hình ảnh nốt nhạc tương ứng.',
        'music-note': 'Đoán Nốt Nhạc',
        'music-note-desc': 'Trò chơi đoán nốt nhạc với 3 cấp độ khó.',
        'level': 'Cấp độ',
        'level-visual': 'Nhìn',
        'level-audio': 'Nghe',
        'level-match': 'Ghép',
        'please-select-answer': 'Vui lòng chọn một đáp án.',
        'music-match': 'Ghép Nhạc Cụ',
        'music-match-desc': 'Kéo thả tên nhạc cụ vào đúng hình ảnh.',
        'vovinam-quiz': 'Trắc nghiệm Vovinam',
        'vovinam-quiz-desc': 'Trả lời các câu hỏi về lịch sử và kỹ thuật.',
        'loading-submissions': 'Đang tải bài nộp...',
        'no-videos-for-feedback': 'Chưa có bài nộp nào chờ đánh giá.',
        'no-pending-submissions': 'Không có bài nộp nào đang chờ duyệt.',
        'view-submissions': 'Xem bài nộp',
        'review-submissions': 'Xem và đánh giá bài nộp sinh viên.',
        'student-note': 'Ghi chú của SV',
        'teacher-comment-placeholder': 'Nhận xét của giảng viên...',
        'approve': 'Duyệt',
        'reject': 'Từ chối',
        'points-to-award': 'Điểm thưởng (nếu duyệt)',
        'role': 'Vai trò',
        'edit-profile': 'Chỉnh sửa hồ sơ',
        'change-password': 'Đổi mật khẩu',
        'level': 'Cấp độ',
        'streak-text': 'Chuỗi đăng nhập',
        'days': 'ngày',
        'achievements': 'Thành tựu',
        'no-achievements': 'Chưa có thành tựu nào.',
        'activity': 'Hoạt động',
        'last-active': 'Hoạt động gần đây',
        'join-date': 'Ngày tham gia',
        'no-courses': 'Chưa tham gia khóa học nào.',
        'new-name': 'Tên mới',
        'save-changes': 'Lưu thay đổi',
        'cancel': 'Hủy',
        'current-password': 'Mật khẩu hiện tại',
        'new-password': 'Mật khẩu mới (ít nhất 6 ký tự)',
        'confirm-new-password': 'Xác nhận mật khẩu mới',
        'update': 'Cập nhật',
        'loading-ranking': 'Đang tải bảng xếp hạng...',
        'please-login-ranking': 'Vui lòng đăng nhập để xem xếp hạng.',
        'no-rankings-yet': 'Bảng xếp hạng hiện đang trống.',
        'you': 'Bạn',
        'scroll-up': 'Cuộn lên',
        'scroll-down': 'Cuộn xuống',
        'feedback-prompt': 'Gửi phản hồi giúp chúng tôi cải thiện:',
        'feedback-input-placeholder': 'Nhập phản hồi của bạn...',
        'send-feedback': 'Gửi phản hồi',
        'your-submitted-feedback': 'Phản hồi đã gửi',
        'loading-feedback': 'Đang tải phản hồi...',
        'no-feedback-submitted': 'Bạn chưa gửi phản hồi nào.',
        'your-feedback': 'Phản hồi của bạn',
        'admin-reply': 'Phản hồi từ quản trị viên',
        'submitted': 'Đã gửi',
        'status': 'Trạng thái',
        'replied': 'Đã trả lời',
        'pending': 'Đang chờ',
        'approved': 'Đã duyệt',
        'rejected': 'Đã từ chối',
        'toggle-auth-prompt': 'Chưa có tài khoản?',
        'already-have-account': 'Đã có tài khoản?',
        'enter-name': 'Tên của bạn',
        'enter-email': 'Email',
        'enter-password': 'Mật khẩu',
        'fpt-assistant': 'Trợ lý FPT',
        'enable-speech': 'Bật giọng nói',
        'disable-speech': 'Tắt giọng nói',
        'export-history': 'Xuất lịch sử chat',
        'clear-history': 'Xóa lịch sử chat',
        'close-chat': 'Đóng chat',
        'processing': 'Đang xử lý...',
        'chat-input-placeholder': 'Nhập câu hỏi hoặc nói...',
        'start-speech': 'Nói để nhập',
        'send': 'Gửi',
        'toggle-chatbot': 'Mở Trợ lý FPT',
        'listening': 'Đang nghe...',
        'mic-tooltip': 'Nhấn để nói',
        'speech-enabled': 'Đã bật giọng nói.',
        'speech-disabled': 'Đã tắt giọng nói.',
        'speech-not-supported-browser': 'Trình duyệt không hỗ trợ giọng nói.',
        'speech-synthesis-not-supported': 'Trình duyệt không hỗ trợ phát giọng nói.',
        'speech-recognition-not-supported': 'Trình duyệt không hỗ trợ nhận dạng giọng nói.',
        'speech-error-no-speech': 'Không nhận dạng được giọng nói.',
        'speech-error-audio-capture': 'Lỗi micro.',
        'speech-error-not-allowed': 'Quyền micro bị từ chối.',
        'speech-error-generic': 'Lỗi nhận dạng giọng nói.',
        'chatbot-welcome': 'Xin chào! Tôi là Trợ lý FPT, tôi có thể giúp gì cho bạn?',
        'chatbot-login-prompt': 'Vui lòng đăng nhập để trò chuyện.',
        'no-response': 'Xin lỗi, tôi chưa thể trả lời câu này. Bạn thử hỏi khác nhé?',
        'error': 'Lỗi',
        'server-error': 'Lỗi máy chủ',
        'server-unavailable': 'Máy chủ không phản hồi.',
        'check-cors-backend': 'Kiểm tra CORS/Backend.',
        'invalid-request': 'Yêu cầu không hợp lệ',
        'please-login': 'Vui lòng đăng nhập.',
        'login-success': 'Đăng nhập thành công!',
        'signup-success': 'Đăng ký thành công! Vui lòng đăng nhập.',
        'logout-success': 'Đăng xuất thành công!',
        'session-expired': 'Phiên hết hạn. Vui lòng đăng nhập lại.',
        'token-refresh-error': 'Lỗi làm mới phiên. Vui lòng đăng nhập lại.',
        'fetch-profile-error': 'Lỗi tải hồ sơ.',
        'update-profile-error': 'Lỗi cập nhật hồ sơ.',
        'name-changed': 'Tên đã cập nhật.',
        'password-changed': 'Mật khẩu đã đổi.',
        'password-too-short': 'Mật khẩu mới cần ít nhất 6 ký tự.',
        'passwords-mismatch': 'Mật khẩu xác nhận không khớp.',
        'passwords-same': 'Mật khẩu mới phải khác mật khẩu cũ.',
        'current-password-incorrect': 'Mật khẩu hiện tại không đúng.',
        'check-password-fields': 'Kiểm tra lại các trường mật khẩu.',
        'avatar-changed': 'Ảnh đại diện đã cập nhật.',
        'avatar-upload-error': 'Lỗi tải lên ảnh đại diện.',
        'select-avatar-file': 'Vui lòng chọn file ảnh.',
        'avatar-too-large': `Ảnh quá lớn (Tối đa ${MAX_AVATAR_SIZE_MB}MB).`,
        'invalid-avatar-type': `Loại file ảnh không hợp lệ (${ALLOWED_AVATAR_EXTENSIONS.join(', ')}).`,
        'fetch-courses-error': 'Lỗi tải khóa học.',
        'added-to-favorites': 'Đã thêm vào khóa học của tôi.',
        'removed-from-favorites': 'Đã xóa khỏi khóa học của tôi.',
        'add-favorite-error': 'Lỗi thêm khóa học yêu thích.',
        'remove-favorite-error': 'Lỗi xóa khóa học yêu thích.',
        'already-in-favorites': 'Khóa học đã có trong danh sách.',
        'fetch-rankings-error': 'Lỗi tải bảng xếp hạng.',
        'ranking-updated': 'Bảng xếp hạng đã cập nhật!',
        'ranking-stream-error': 'Mất kết nối cập nhật xếp hạng.',
        'ranking-stream-connected': 'Đã kết nối cập nhật xếp hạng.',
        'ranking-stream-disconnected': 'Đã ngắt kết nối cập nhật xếp hạng.',
        'flashcard-progress-saved': 'Đã lưu tiến độ Flashcard.',
        'flashcard-progress-error': 'Lỗi lưu tiến độ Flashcard.',
        'fetch-flashcards-error': 'Lỗi tải Flashcards.',
        'test-completed': 'Hoàn thành kiểm tra!',
        'flashcard-test-error': 'Lỗi nộp bài kiểm tra Flashcard.',
        'challenge-fetch-error': 'Lỗi tải thử thách.',
        'submission-error': 'Lỗi nộp bài.',
        'challenge-submitted': 'Đã nộp bài thử thách!',
        'select-submission-file': 'Vui lòng chọn file.',
        'submission-too-large': `File quá lớn (Tối đa ${MAX_SUBMISSION_SIZE_MB}MB).`,
        'invalid-submission-type': `Loại file không hợp lệ (${ALLOWED_SUBMISSION_EXTENSIONS.join(', ')}).`,
        'fetch-submissions-error': 'Lỗi tải bài nộp.',
        'review-success': 'Đánh giá thành công.',
        'review-error': 'Lỗi đánh giá bài nộp.',
        'enter-comment-reject': 'Vui lòng nhập nhận xét khi từ chối.',
        'fetch-path-error': 'Lỗi tải lộ trình học tập.',
        'game-start-error': 'Lỗi bắt đầu mini-game.',
        'game-submit-error': 'Lỗi nộp câu trả lời.',
        'game-correct': 'Chính xác!',
        'game-incorrect': 'Chưa đúng. Đáp án là:',
        'game-points-awarded': 'Bạn nhận được',
        'game-points': 'điểm',
        'please-enter-answer': 'Vui lòng nhập câu trả lời.',
        'checking': 'Đang kiểm tra...',
        'try-again': 'Thử lại',
        'next-question': 'Câu hỏi tiếp theo',
        'loading': 'Đang tải...',
        'game-reset': 'Đã đặt lại câu hỏi',
        'game-reset-error': 'Lỗi đặt lại câu hỏi',
        'next-question-loaded': 'Đã tải câu hỏi tiếp theo',
        'game-completed': 'Hoàn thành mini-game!',
        'load-game-error': 'Lỗi tải câu hỏi tiếp theo',
        'please-login-game': 'Vui lòng đăng nhập để chơi.',
        'play-audio': 'Phát âm thanh',
        'chat-history-cleared': 'Đã xóa lịch sử chat.',
        'history-exported': 'Đã xuất lịch sử chat.',
        'error-exporting-history': 'Lỗi xuất lịch sử.',
        'error-saving-history': 'Lỗi lưu lịch sử chat.',
        'error-loading-history': 'Lỗi tải lịch sử chat.',
        'feedback-submitted': 'Đã gửi phản hồi. Xin cảm ơn!',
        'feedback-error': 'Lỗi gửi phản hồi.',
        'feedback-text-empty': 'Nội dung phản hồi không được trống.',
        'fetch-feedback-error': 'Lỗi tải phản hồi đã gửi.',
        'error-loading-data': 'Lỗi tải dữ liệu ban đầu.',
        'no-courses-available': 'Chưa có khóa học.',
        'learn': 'Học',
        'add-favorite': 'Thêm',
        'remove': 'Xóa',
        'overall-progress': 'Tiến độ tổng thể',
        'change-avatar': 'Đổi ảnh đại diện',
        'points-earned': 'Điểm nhận được',
        'level-up': 'Lên cấp!',
        'achievement-unlocked': 'Mở khóa thành tựu!',
        'loading-test': 'Đang tạo bài kiểm tra...',
        'enter-answer': 'Nhập câu trả lời...',
        'please-login-challenge': 'Vui lòng đăng nhập để xem thử thách.',
        'challenge-submitted-message': 'Đã nộp!',
        'start': 'Bắt đầu',
        'locked': 'Đã khóa',
        'completed': 'Hoàn thành',
        'no-access-teacher': 'Chức năng chỉ dành cho giảng viên.',
        'toggle-light-mode': '🌞',
        'toggle-dark-mode': '😎',
        'dark-mode-enabled': 'Đã bật chế độ tối.',
        'light-mode-enabled': 'Đã bật chế độ sáng.',
        'language-changed': 'Đã đổi ngôn ngữ.',
        'name-required': 'Vui lòng nhập tên.',
        'invalid-email': 'Email không hợp lệ.',
        'password-required': 'Vui lòng nhập mật khẩu.',
        'confirm-clear-history': 'Xác nhận xóa lịch sử chat?',
        'error-clearing-history': 'Lỗi xóa lịch sử chat.',
        'no-history-to-export': 'Không có lịch sử để xuất.',
        'enter-new-name': 'Vui lòng nhập tên mới.',
        'name-not-changed': 'Tên không thay đổi.',
        'connecting': 'Đang kết nối...',
        'token-missing': 'Thiếu token xác thực.',
        'sao': 'Sáo', 'dan-tranh': 'Đàn Tranh', 'dan-nguyet': 'Đàn Nguyệt', 'vovinam': 'Vovinam',
        'no-image': 'Không có ảnh',
        'please-login-path': 'Đăng nhập để xem lộ trình.',
        'no-file-chosen': 'Chưa chọn file',
        'no-progress-to-save': 'Không có tiến độ để lưu.',
        'no-flashcards-available': 'Không có flashcard nào để kiểm tra.',
        'results': 'Kết quả', 'correct': 'Đúng', 'incorrect': 'Sai', 'answer': 'Đáp án', 'score': 'Điểm',
        'none': 'Không có', 'download': 'Tải xuống', 'type': 'Loại',
        'login-failed': 'Đăng nhập thất bại', 'signup-failed': 'Đăng ký thất bại',
        'no-search-results': 'Không tìm thấy kết quả', 'network-error': 'Lỗi mạng',
        'video-not-supported': 'Trình duyệt không hỗ trợ video.', 'image-load-error': 'Lỗi tải ảnh',
        'please-login-flashcard': 'Đăng nhập để ôn tập',
        'student': 'Sinh viên', 'teacher': 'Giảng viên', 'admin': 'Quản trị viên',
        'teacher-analytics': 'Phân tích GV',
        'loading-analytics': 'Đang tải phân tích...',
        'no-analytics': 'Chưa có dữ liệu phân tích.',
        'total-reviewed': 'Tổng bài đã chấm',
        'approved-count': 'Đã duyệt',
        'rejected-count': 'Đã từ chối',
        'pending-submissions': 'Bài chờ chấm',
        'associated-students': 'Số SV liên kết',
        'fetch-analytics-error': 'Lỗi tải dữ liệu phân tích.',
        'students-list': 'Danh sách Sinh viên',
        'loading-students': 'Đang tải danh sách SV...',
        'no-students': 'Không có sinh viên nào.',
        'fetch-students-error': 'Lỗi tải danh sách sinh viên.',
        'using-offline-data': 'Sử dụng dữ liệu ngoại tuyến.',
        'student-details': 'Chi tiết Sinh viên',
        'view-details': 'Xem chi tiết',
        'update-progress': 'Cập nhật tiến độ',
        'new-progress-value': 'Tiến độ mới (%)',
        'progress-updated-success': 'Cập nhật tiến độ thành công.',
        'progress-update-error': 'Lỗi cập nhật tiến độ.',
        'submissions': 'Bài nộp',
        'students': 'Học viên',
        'reply-placeholder': 'Nhập phản hồi của bạn...',
        'reply': 'Trả lời',
        'notify': 'Thông báo',
        'reply-text-empty': 'Nội dung trả lời không được trống.',
        'reply-sent-success': 'Đã gửi phản hồi thành công.',
        'reply-error': 'Lỗi gửi phản hồi.',
        'notification-sent': 'Đã gửi thông báo.',
        'notification-error': 'Lỗi gửi thông báo.',
        'notified': 'Đã thông báo',
        'your-reply': 'Phản hồi của bạn',
        'current': 'Hiện tại',
        'theory-size': 'Kích thước lý thuyết',
        'increase-size': 'Tăng kích thước',
        'decrease-size': 'Giảm kích thước',
        'reset-size': 'Đặt lại kích thước',
    },
    en: {
        'loading': 'Loading...',
        'title': 'FPT Learning Hub',
        'explore': 'Explore',
        'activities': 'Activities',
        'instruments': 'Traditional Instruments',
        'martial-arts': 'Martial Arts',
        'flashcards': 'Flashcards Review',
        'ranking': 'Ranking',
        'challenges': 'Challenges',
        'challenge': 'Today\'s Challenge',
        'challenge-submission': 'Challenge Submission',
        'practice': 'Practice Exercise',
        'mini-games': 'Mini-games',
        'teacher-dashboard': 'Teacher Dashboard',
        'feedback': 'Feedback',
        'search-placeholder': 'Search courses...',
        'toggle-theme': 'Toggle theme',
        'toggle-language': '🌐',
        'login': 'Login',
        'signup': 'Sign up',
        'logout': '➡️',
        'profile': 'Profile',
        'hero-title': 'Learn Traditional Instruments & Vovinam',
        'hero-desc': 'Explore Vietnamese culture through free courses.',
        'start-now': 'Start Now',
        'loading-courses': 'Loading courses...',
        'loading-profile': 'Loading profile...',
        'my-courses': 'My Courses',
        'no-personal-courses': 'Drag courses here or add from the list.',
        'learning-path': 'Learning Path',
        'loading-path': 'Loading path...',
        'no-learning-path': 'No learning path yet.',
        'random-test': 'Random Test',
        'save-progress': 'Save Progress',
        'prev-card': 'Previous Card',
        'next-card': 'Next Card',
        'test-now': 'Test Now',
        'progress': 'Progress',
        'points': 'Points',
        'submit-test': 'Submit Test',
        'close': 'Close',
        'loading-flashcards': 'Loading flashcards...',
        'no-flashcards-category': 'No flashcards for this category.',
        'loading-challenge': 'Loading challenge...',
        'no-challenge-today': 'No new challenge today.',
        'submit-challenge': 'Submit Challenge',
        'challenge-note-placeholder': 'Notes (optional)...',
        'select-file': 'Select file (Image/Video)',
        'guess-note': 'Guess the Note',
        'guess-note-desc': 'Look at the image and guess the musical note.',
        'guess-pose': 'Guess the Pose',
        'guess-pose-desc': 'Look at the image and guess the Vovinam pose name.',
        'guess-stance': 'Guess the Stance',
        'guess-stance-desc': 'Identify the Vovinam stance from the image.',
        'listen-note': 'Listen and Guess Note',
        'listen-note-desc': 'Listen to the audio and guess the correct musical note.',
        'match-note': 'Match the Note',
        'match-note-desc': 'Listen to the audio and select the matching musical note image.',
        'music-note': 'Musical Notes Game',
        'music-note-desc': 'Musical note guessing game with 3 difficulty levels.',
        'level': 'Level',
        'level-visual': 'Visual',
        'level-audio': 'Audio',
        'level-match': 'Match',
        'please-select-answer': 'Please select an answer.',
        'music-match': 'Match Instruments',
        'music-match-desc': 'Drag and drop instrument names to the correct images.',
        'vovinam-quiz': 'Vovinam Quiz',
        'vovinam-quiz-desc': 'Answer questions about history and techniques.',
        'loading-submissions': 'Loading submissions...',
        'no-videos-for-feedback': 'No submissions waiting for review.',
        'no-pending-submissions': 'No pending submissions to review.',
        'view-submissions': 'View Submissions',
        'review-submissions': 'Review student submissions.',
        'student-note': 'Student Note',
        'teacher-comment-placeholder': 'Teacher\'s comment...',
        'approve': 'Approve',
        'reject': 'Reject',
        'points-to-award': 'Points to award (if approved)',
        'role': 'Role',
        'edit-profile': 'Edit Profile',
        'change-password': 'Change Password',
        'level': 'Level',
        'streak-text': 'Login Streak',
        'days': 'days',
        'achievements': 'Achievements',
        'no-achievements': 'No achievements yet.',
        'activity': 'Activity',
        'last-active': 'Last Active',
        'join-date': 'Join Date',
        'no-courses': 'No courses enrolled.',
        'new-name': 'New Name',
        'save-changes': 'Save Changes',
        'cancel': 'Cancel',
        'current-password': 'Current Password',
        'new-password': 'New Password (at least 6 characters)',
        'confirm-new-password': 'Confirm New Password',
        'update': 'Update',
        'loading-ranking': 'Loading ranking...',
        'please-login-ranking': 'Please login to view ranking.',
        'no-rankings-yet': 'Ranking is currently empty.',
        'you': 'You',
        'scroll-up': 'Scroll Up',
        'scroll-down': 'Scroll Down',
        'feedback-prompt': 'Send feedback to help us improve:',
        'feedback-input-placeholder': 'Enter your feedback...',
        'send-feedback': 'Send Feedback',
        'your-submitted-feedback': 'Your Submitted Feedback',
        'loading-feedback': 'Loading feedback...',
        'no-feedback-submitted': 'You haven\'t submitted any feedback yet.',
        'your-feedback': 'Your Feedback',
        'admin-reply': 'Admin Reply',
        'submitted': 'Submitted',
        'status': 'Status',
        'replied': 'Replied',
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'toggle-auth-prompt': 'Don\'t have an account?',
        'already-have-account': 'Already have an account?',
        'enter-name': 'Your Name',
        'enter-email': 'Email',
        'enter-password': 'Password',
        'fpt-assistant': 'FPT Assistant',
        'enable-speech': 'Enable speech',
        'disable-speech': 'Disable speech',
        'export-history': 'Export chat history',
        'clear-history': 'Clear chat history',
        'close-chat': 'Close chat',
        'processing': 'Processing...',
        'chat-input-placeholder': 'Type a question or speak...',
        'start-speech': 'Speak to input',
        'send': 'Send',
        'toggle-chatbot': 'Open FPT Assistant',
        'listening': 'Listening...',
        'mic-tooltip': 'Click to speak',
        'speech-enabled': 'Speech enabled.',
        'speech-disabled': 'Speech disabled.',
        'speech-not-supported-browser': 'Browser does not support speech.',
        'speech-synthesis-not-supported': 'Browser does not support speech synthesis.',
        'speech-recognition-not-supported': 'Browser does not support speech recognition.',
        'speech-error-no-speech': 'No speech detected.',
        'speech-error-audio-capture': 'Microphone error.',
        'speech-error-not-allowed': 'Microphone permission denied.',
        'speech-error-generic': 'Speech recognition error.',
        'chatbot-welcome': 'Hello! I\'m FPT Assistant, how can I help you?',
        'chatbot-login-prompt': 'Please login to chat.',
        'no-response': 'Sorry, I couldn\'t answer that. Try asking something else?',
        'error': 'Error',
        'server-error': 'Server error',
        'server-unavailable': 'Server not responding.',
        'check-cors-backend': 'Check CORS/Backend.',
        'invalid-request': 'Invalid request',
        'please-login': 'Please login.',
        'login-success': 'Login successful!',
        'signup-success': 'Signup successful! Please login.',
        'logout-success': 'Logout successful!',
        'session-expired': 'Session expired. Please login again.',
        'token-refresh-error': 'Session refresh error. Please login again.',
        'fetch-profile-error': 'Error loading profile.',
        'update-profile-error': 'Error updating profile.',
        'name-changed': 'Name updated.',
        'password-changed': 'Password changed.',
        'password-too-short': 'New password must be at least 6 characters.',
        'passwords-mismatch': 'Confirmation password does not match.',
        'passwords-same': 'New password must be different from old password.',
        'current-password-incorrect': 'Current password is incorrect.',
        'check-password-fields': 'Check password fields again.',
        'avatar-changed': 'Avatar updated.',
        'avatar-upload-error': 'Error uploading avatar.',
        'select-avatar-file': 'Please select an image file.',
        'avatar-too-large': `Image too large (Max ${MAX_AVATAR_SIZE_MB}MB).`,
        'invalid-avatar-type': `Invalid image type (${ALLOWED_AVATAR_EXTENSIONS.join(', ')}).`,
        'fetch-courses-error': 'Error loading courses.',
        'added-to-favorites': 'Added to my courses.',
        'removed-from-favorites': 'Removed from my courses.',
        'add-favorite-error': 'Error adding favorite course.',
        'remove-favorite-error': 'Error removing favorite course.',
        'already-in-favorites': 'Course already in your list.',
        'fetch-rankings-error': 'Error loading rankings.',
        'ranking-updated': 'Ranking updated!',
        'ranking-stream-error': 'Lost ranking update connection.',
        'ranking-stream-connected': 'Connected to ranking updates.',
        'ranking-stream-disconnected': 'Disconnected from ranking updates.',
        'flashcard-progress-saved': 'Flashcard progress saved.',
        'flashcard-progress-error': 'Error saving Flashcard progress.',
        'fetch-flashcards-error': 'Error loading Flashcards.',
        'test-completed': 'Test completed!',
        'flashcard-test-error': 'Error submitting Flashcard test.',
        'challenge-fetch-error': 'Error loading challenge.',
        'submission-error': 'Submission error.',
        'challenge-submitted': 'Challenge submitted!',
        'select-submission-file': 'Please select a file.',
        'submission-too-large': `File too large (Max ${MAX_SUBMISSION_SIZE_MB}MB).`,
        'invalid-submission-type': `Invalid file type (${ALLOWED_SUBMISSION_EXTENSIONS.join(', ')}).`,
        'fetch-submissions-error': 'Error loading submissions.',
        'review-success': 'Review successful.',
        'review-error': 'Error reviewing submission.',
        'enter-comment-reject': 'Please enter a comment when rejecting.',
        'fetch-path-error': 'Error loading learning path.',
        'game-start-error': 'Error starting mini-game.',
        'game-submit-error': 'Error submitting answer.',
        'game-correct': 'Correct!',
        'game-incorrect': 'Incorrect. The answer is:',
        'game-points-awarded': 'You received',
        'game-points': 'points',
        'please-enter-answer': 'Please enter an answer.',
        'checking': 'Checking...',
        'try-again': 'Try Again',
        'next-question': 'Next Question',
        'loading': 'Loading...',
        'game-reset': 'Question reset',
        'game-reset-error': 'Error resetting question',
        'next-question-loaded': 'Next question loaded',
        'game-completed': 'Mini-game completed!',
        'load-game-error': 'Error loading next question',
        'please-login-game': 'Please login to play.',
        'play-audio': 'Play audio',
        'chat-history-cleared': 'Chat history cleared.',
        'history-exported': 'Chat history exported.',
        'error-exporting-history': 'Error exporting history.',
        'error-saving-history': 'Error saving chat history.',
        'error-loading-history': 'Error loading chat history.',
        'feedback-submitted': 'Feedback submitted. Thank you!',
        'feedback-error': 'Error sending feedback.',
        'feedback-text-empty': 'Feedback content cannot be empty.',
        'fetch-feedback-error': 'Error loading submitted feedback.',
        'error-loading-data': 'Error loading initial data.',
        'no-courses-available': 'No courses available yet.',
        'learn': 'Learn',
        'add-favorite': 'Add',
        'remove': 'Remove',
        'overall-progress': 'Overall Progress',
        'change-avatar': 'Change Avatar',
        'points-earned': 'Points earned',
        'level-up': 'Level up!',
        'achievement-unlocked': 'Achievement unlocked!',
        'loading-test': 'Creating test...',
        'enter-answer': 'Enter answer...',
        'please-login-challenge': 'Please login to view challenges.',
        'challenge-submitted-message': 'Submitted!',
        'start': 'Start',
        'locked': 'Locked',
        'completed': 'Completed',
        'no-access-teacher': 'Function only for teachers.',
        'toggle-light-mode': '😎',
        'toggle-dark-mode': 'Dark Mode',
        'dark-mode-enabled': 'Dark mode enabled.',
        'light-mode-enabled': 'Light mode enabled.',
        'language-changed': 'Language changed.',
        'name-required': 'Please enter a name.',
        'invalid-email': 'Invalid email.',
        'password-required': 'Please enter a password.',
        'confirm-clear-history': 'Confirm clear chat history?',
        'error-clearing-history': 'Error clearing chat history.',
        'no-history-to-export': 'No history to export.',
        'enter-new-name': 'Please enter a new name.',
        'name-not-changed': 'Name not changed.',
        'connecting': 'Connecting...',
        'token-missing': 'Authentication token missing.',
        'sao': 'Flute', 'dan-tranh': 'Zither', 'dan-nguyet': 'Moon Lute', 'vovinam': 'Vovinam',
        'no-image': 'No image',
        'please-login-path': 'Login to view path.',
        'no-file-chosen': 'No file chosen',
        'no-progress-to-save': 'No progress to save.',
        'no-flashcards-available': 'No flashcards available for testing.',
        'results': 'Results', 'correct': 'Correct', 'incorrect': 'Incorrect', 'answer': 'Answer', 'score': 'Score',
        'none': 'None', 'download': 'Download', 'type': 'Type',
        'login-failed': 'Login failed', 'signup-failed': 'Signup failed',
        'no-search-results': 'No search results', 'network-error': 'Network error',
        'video-not-supported': 'Browser does not support video.', 'image-load-error': 'Error loading image',
        'please-login-flashcard': 'Login to review',
        'student': 'Student', 'teacher': 'Teacher', 'admin': 'Administrator',
        'teacher-analytics': 'Teacher Analytics',
        'loading-analytics': 'Loading analytics...',
        'no-analytics': 'No analytics data yet.',
        'total-reviewed': 'Total Reviewed',
        'approved-count': 'Approved',
        'rejected-count': 'Rejected',
        'pending-submissions': 'Pending Submissions',
        'associated-students': 'Associated Students',
        'fetch-analytics-error': 'Error loading analytics data.',
        'students-list': 'Students List',
        'loading-students': 'Loading students list...',
        'no-students': 'No students.',
        'fetch-students-error': 'Error loading students list.',
        'using-offline-data': 'Using offline data.',
        'student-details': 'Student Details',
        'view-details': 'View details',
        'update-progress': 'Update Progress',
        'new-progress-value': 'New progress value (%)',
        'progress-updated-success': 'Progress updated successfully.',
        'progress-update-error': 'Error updating progress.',
        'submissions': 'Submissions',
        'students': 'Students',
        'reply-placeholder': 'Enter your reply...',
        'reply': 'Reply',
        'notify': 'Notify',
        'reply-text-empty': 'Reply content cannot be empty.',
        'reply-sent-success': 'Reply sent successfully.',
        'reply-error': 'Error sending reply.',
        'notification-sent': 'Notification sent.',
        'notification-error': 'Error sending notification.',
        'notified': 'Notified',
        'your-reply': 'Your Reply',
        'current': 'Current',
        'theory-size': 'Theory size',
        'increase-size': 'Increase size',
        'decrease-size': 'Decrease size',
        'reset-size': 'Reset size',
    }
};

// --- Utility Functions ---
function getTranslation(key) { return languageData[currentLanguage]?.[key] || languageData['vi'][key] || key; }
function showLoading() { const el = document.querySelector('.loader'); if (el) el.style.display = 'flex'; }
function hideLoading() { const el = document.querySelector('.loader'); if (el) el.style.display = 'none'; }
function showNotification(message, type = 'info', duration = 3000) { const n = document.getElementById('notification'); if (!n) return; n.className = 'notification'; clearTimeout(n.timer); n.classList.add(type); n.textContent = message; n.style.display = 'block'; n.style.transform = 'translateX(110%)'; if (window.anime) { anime({ targets: n, translateX: ['110%', '0%'], opacity: [0, 1], duration: 500, easing: 'easeOutCubic' }); } else { n.style.opacity = '1'; n.style.transform = 'translateX(0%)'; } n.timer = setTimeout(hideNotification, duration); }
function hideNotification() { const n = document.getElementById('notification'); if (!n || n.style.display === 'none') return; clearTimeout(n.timer); if (window.anime) { anime({ targets: n, translateX: '110%', opacity: 0, duration: 500, easing: 'easeInCubic', complete: () => { n.style.display = 'none'; n.textContent = ''; n.className = 'notification'; } }); } else { n.style.opacity = '0'; n.style.transform = 'translateX(110%)'; setTimeout(() => { if (n.style.opacity === '0') { n.style.display = 'none'; n.textContent = ''; n.className = 'notification'; } }, 500); } }
function debounce(func, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => func.apply(this, args), wait); }; }
function getFullAssetUrl(url) { if (!url) return './assets/images/placeholder.png'; if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url; return `${API_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`; }

// Function to handle theory size adjustment
function handleTheorySizeAdjustment(event) {
    const target = event.target.closest('.theory-size-btn');
    if (!target) return;

    // Find the closest theory container
    const container = target.closest('.theory-container');
    if (!container) return;

    // Get current scale level or set default
    let currentScale = parseFloat(container.dataset.scale || '1.0');
    const action = target.dataset.action;

    // Adjust scale based on action
    switch (action) {
        case 'increase':
            currentScale += 0.1;
            break;
        case 'decrease':
            currentScale -= 0.1;
            break;
        case 'reset':
            currentScale = 1.0; // Default scale level
            break;
    }

    // Ensure scale is within reasonable limits
    currentScale = Math.max(0.5, Math.min(1.5, currentScale));

    // Apply the new scale level to the container
    container.style.transform = `scale(${currentScale})`;
    container.dataset.scale = currentScale.toString();

    // Adjust container width based on scale to maintain proper layout
    container.style.width = `${(100 / currentScale)}%`;
    container.style.transformOrigin = 'top center';

    // Show notification
    showNotification(`${getTranslation('theory-size')}: ${Math.round(currentScale * 100)}%`, 'info', 1500);
}

async function apiFetch(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (options.body instanceof FormData) delete headers['Content-Type'];

    // Store the request data for mock responses
    lastRequestData = {
        url,
        method: options.method || 'GET',
        headers,
        body: options.body instanceof FormData ? null : options.body
    };

    // For debugging
    console.log(`API Request: ${url}`, { method: options.method || 'GET', headers });

    try {
        // Handle CORS issues by using a proxy or mock data for specific endpoints
        if (endpoint.includes('/api/flashcards')) {
            // Mock flashcard data
            console.log('Using mock flashcard data');
            return mockFlashcardResponse(endpoint);
        } else if (endpoint.includes('/api/challenges')) {
            // Mock challenge data
            console.log('Using mock challenge data');
            return mockChallengeResponse();
        } else if (endpoint.includes('/api/teacher/analytics')) {
            // Mock teacher analytics data
            console.log('Using mock teacher analytics data');
            return mockTeacherAnalyticsResponse();
        } else if (endpoint.includes('/api/courses')) {
            // Mock courses data
            console.log('Using mock courses data');
            return mockCoursesResponse(endpoint);
        } else if (endpoint.includes('/api/users/personal-courses')) {
            // Mock personal courses data
            console.log('Using mock personal courses data');
            return mockPersonalCoursesResponse(endpoint, options);
        } else if (endpoint.includes('/api/mini-game/start')) {
            // Mock mini-game data
            console.log('Using mock mini-game data');
            return mockMiniGameResponse(endpoint);
        } else if (endpoint.includes('/api/mini-game/submit')) {
            // Mock mini-game submit response
            console.log('Using mock mini-game submit response');
            return mockMiniGameSubmitResponse(options);
        }

        // For other endpoints, try the normal fetch
        const response = await fetch(url, {
            ...options,
            headers,
            mode: 'cors',
            credentials: 'include'
        });

        if (response.status === 401) {
            console.log("Token expired/invalid, refreshing...");
            const refreshed = await refreshToken();

            if (refreshed) {
                console.log("Retrying original request...");
                const newHeaders = { ...headers };
                const newToken = localStorage.getItem('token');

                if (newToken) newHeaders['Authorization'] = `Bearer ${newToken}`;
                if (options.body instanceof FormData) delete newHeaders['Content-Type'];

                const retryResponse = await fetch(url, {
                    ...options,
                    headers: newHeaders,
                    mode: 'cors',
                    credentials: 'include'
                });

                if (retryResponse.status === 401) {
                    console.error("Retry failed (401). Logging out.");
                    logout();
                    throw new Error(getTranslation('session-expired'));
                }

                if (!retryResponse.ok) {
                    const errData = await retryResponse.json().catch(() => ({ message: `HTTP ${retryResponse.status}` }));
                    throw new Error(errData.message || `HTTP ${retryResponse.status}`);
                }

                return retryResponse;
            } else {
                throw new Error(getTranslation('session-expired'));
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error(`API Fetch Error (${endpoint}):`, error);

        if (!(error instanceof DOMException && error.name === 'AbortError')) {
            // Handle CORS errors or network errors
            if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
                showNotification(`${getTranslation('server-unavailable')} (${getTranslation('check-cors-backend')})`, 'warning', 5001);
                console.warn('CORS or network issue detected, using mock data');

                // Try to use mock data for critical endpoints if fetch fails
                if (endpoint.includes('/api/flashcards')) {
                    return mockFlashcardResponse(endpoint);
                } else if (endpoint.includes('/api/challenges')) {
                    return mockChallengeResponse();
                } else if (endpoint.includes('/api/teacher/analytics')) {
                    return mockTeacherAnalyticsResponse();
                } else if (endpoint.includes('/api/feedback') && endpoint.includes('/notify')) {
                    return mockFeedbackNotifyResponse();
                } else if (endpoint.includes('/api/courses')) {
                    return mockCoursesResponse(endpoint);
                } else if (endpoint.includes('/api/users/personal-courses')) {
                    return mockPersonalCoursesResponse(endpoint, options);
                }
            } else if (error.message !== getTranslation('session-expired')) {
                showNotification(error.message || getTranslation('server-error'), 'error');
            }
        }

        throw error;
    }
}

// Mock response functions for when the API is unavailable
async function mockFlashcardResponse(endpoint) {
    // Extract category from endpoint
    const category = endpoint.split('category=')[1] || 'sao';

    // Create mock flashcard data based on category
    const mockData = {
        sao: [
            { id: 'sao', front: 'Sáo trúc là gì?', back: 'Nhạc cụ hơi truyền thống của Việt Nam, làm từ ống trúc' },
            { id: 'sao', front: 'Kỹ thuật thổi sáo cơ bản', back: 'Đặt môi vào lỗ thổi, điều chỉnh hơi thở và ngón tay trên các lỗ bấm' },
            { id: 'sao', front: 'Các nốt cơ bản trên sáo', back: 'Đô, Rê, Mi, Fa, Sol, La, Si với các biến thể nửa cung' }
        ],
        'dan-tranh': [
            { id: 'dt1', front: 'Đàn tranh có bao nhiêu dây?', back: 'Truyền thống có 16 dây, hiện đại có thể có 17-19 dây' },
            { id: 'dt2', front: 'Kỹ thuật gảy đàn tranh', back: 'Gảy, véo, vỗ, vuốt, rung' },
            { id: 'dt3', front: 'Cách lên dây đàn tranh', back: 'Sử dụng chìa khóa điều chỉnh độ căng của dây để tạo ra các nốt chuẩn' }
        ],
        'dan-nguyet': [
            { id: 'dn1', front: 'Đàn nguyệt còn gọi là gì?', back: 'Đàn kìm hoặc nguyệt cầm' },
            { id: 'dn2', front: 'Đàn nguyệt có mấy dây?', back: 'Có 2 dây chính' },
            { id: 'dn3', front: 'Thân đàn nguyệt làm từ gì?', back: 'Gỗ quý như gỗ mun, gỗ trắc hoặc gỗ dâu' }
        ],
        vovinam: [
            { id: 'vn1', front: 'Vovinam được sáng lập năm nào?', back: 'Năm 1938 bởi Nguyễn Lộc' },
            { id: 'vn2', front: 'Các đòn chân đặc trưng của Vovinam', back: 'Đá tạt, đá đạp, đá bay, đá lẹo, đòn chân tấn công' },
            { id: 'vn3', front: 'Màu đai trong Vovinam', back: 'Trắng, xanh lam, vàng, đỏ, nâu, đen (từ thấp đến cao)' }
        ]
    };

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData[category] || []
    };

    return mockResponse;
}



async function mockChallengeResponse() {
    // Create an array of 7 mock challenges (one for each day of the week)
    const mockChallenges = [
        {
            _id: 'challenge1',
            title: 'Thử thách hôm nay: Giai điệu dân gian',
            description: 'Hãy ghi lại video bạn chơi một bài dân ca Việt Nam trên nhạc cụ bạn đang học.',
            thumbnail: './assets/images/challenges/folk-music.jpg',
            points: 50,
            type: 'Video',
            deadline: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
        },
        {
            _id: 'challenge2',
            title: 'Thử thách hôm nay: Kỹ thuật cơ bản',
            description: 'Quay video thể hiện kỹ thuật cơ bản của nhạc cụ hoặc võ thuật bạn đang học.',
            thumbnail: './assets/images/challenges/basic-technique.jpg',
            points: 40,
            type: 'Video',
            deadline: new Date(Date.now() + 86400000).toISOString()
        },
        {
            _id: 'challenge3',
            title: 'Thử thách hôm nay: Sáng tạo',
            description: 'Tạo một biến thể sáng tạo từ một bài học bạn đã hoàn thành và chia sẻ kết quả.',
            thumbnail: './assets/images/challenges/creative.jpg',
            points: 60,
            type: 'Video/Ảnh',
            deadline: new Date(Date.now() + 86400000).toISOString()
        },
        {
            _id: 'challenge4',
            title: 'Thử thách hôm nay: Lý thuyết âm nhạc',
            description: 'Viết một đoạn ngắn giải thích về lý thuyết âm nhạc hoặc kỹ thuật võ thuật bạn đã học được.',
            thumbnail: './assets/images/challenges/music-theory.jpg',
            points: 45,
            type: 'Văn bản',
            deadline: new Date(Date.now() + 86400000).toISOString()
        },
        {
            _id: 'challenge5',
            title: 'Thử thách hôm nay: Hợp tác',
            description: 'Kết hợp với một bạn học khác để tạo ra một bài biểu diễn hoặc bài tập chung.',
            thumbnail: './assets/images/challenges/collaboration.jpg',
            points: 70,
            type: 'Video',
            deadline: new Date(Date.now() + 86400000).toISOString()
        },
        {
            _id: 'challenge6',
            title: 'Thử thách hôm nay: Ứng dụng thực tế',
            description: 'Chia sẻ cách bạn áp dụng kiến thức đã học vào một tình huống thực tế.',
            thumbnail: './assets/images/challenges/practical.jpg',
            points: 55,
            type: 'Ảnh/Văn bản',
            deadline: new Date(Date.now() + 86400000).toISOString()
        },
        {
            _id: 'challenge7',
            title: 'Thử thách hôm nay: Tự đánh giá',
            description: 'Quay video tự đánh giá kỹ năng hiện tại của bạn và đặt mục tiêu cho tuần tới.',
            thumbnail: './assets/images/challenges/self-assessment.jpg',
            points: 50,
            type: 'Video',
            deadline: new Date(Date.now() + 86400000).toISOString()
        }
    ];

    // Get the current day of the week (0-6, where 0 is Sunday)
    const dayOfWeek = new Date().getDay();

    // Select the challenge based on the day of the week
    const todayChallenge = mockChallenges[dayOfWeek];

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => todayChallenge
    };

    return mockResponse;
}

async function mockTeacherAnalyticsResponse() {
    // Create mock teacher analytics data
    const mockData = {
        totalReviewed: 25,
        approvedCount: 18,
        rejectedCount: 7,
        pendingSubmissions: 5,
        associatedStudents: 12
    };

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData
    };

    return mockResponse;
}

async function mockCoursesResponse(endpoint) {
    // Extract category from endpoint if present
    let category = null;
    if (endpoint.includes('?category=')) {
        category = endpoint.split('?category=')[1];
    }

    // Check if it's a specific course request
    const courseIdMatch = endpoint.match(/\/api\/courses\/([a-zA-Z0-9]+)/);
    const courseId = courseIdMatch ? courseIdMatch[1] : null;

    // Create mock courses data with valid MongoDB ObjectIds
    const mockCourses = [
        {
            _id: '507f1f77bcf86cd799439011',
            title: 'Sáo Trúc Cơ Bản',
            description: 'Khóa học nhập môn về cách cầm sáo, thổi hơi và các nốt cơ bản.',
            category: 'Nhạc cụ dân tộc',
            thumbnail: './assets/images/courses/sao_truc_cb.jpg',
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            theory_url: 'https://docs.google.com/document/d/1QOSk82iV3gMGAmJXd3vYc78pEgu0vC-ghm_fCY83XDA/edit?usp=sharing'
        },
        {
            _id: '507f1f77bcf86cd799439012',
            title: 'Kỹ Thuật Láy Sáo',
            description: 'Nâng cao kỹ thuật chơi sáo với các kỹ thuật láy hơi, rung hơi.',
            category: 'Nhạc cụ dân tộc',
            thumbnail: './assets/images/courses/sao_truc_nc.jpg',
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            theory_url: 'https://docs.google.com/document/d/1QOSk82iV3gMGAmJXd3vYc78pEgu0vC-ghm_fCY83XDA/edit?usp=sharing'
        },
        {
            _id: '507f1f77bcf86cd799439013',
            title: 'Đàn Tranh Cơ Bản',
            description: 'Khóa học nhập môn về cách gảy đàn tranh và các bài tập cơ bản.',
            category: 'Nhạc cụ dân tộc',
            thumbnail: './assets/images/courses/dan_tranh_cb.jpg',
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            theory_url: 'https://docs.google.com/document/d/1W6IkS7mXwusxT9YVDnVmS5BgPptAGPDpqaQirUXWK3g/edit?usp=sharing'
        },
        {
            _id: '507f1f77bcf86cd799439014',
            title: 'Đàn Nguyệt Cơ Bản',
            description: 'Khóa học nhập môn về cách gảy đàn nguyệt và các bài tập cơ bản.',
            category: 'Nhạc cụ dân tộc',
            thumbnail: './assets/images/courses/dan_nguyet_cb.jpg',
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            theory_url: 'https://docs.google.com/document/d/e/2PACX-1vQw_7WLcUWLEJUUxbPUJdBJT7k2qgRBQyM-cXwU-XAJRpqPcKgFYQ_YvxQkYsoXbQ/pub?embedded=true'
        },
        {
            _id: '507f1f77bcf86cd799439015',
            title: 'Vovinam Nhập Môn',
            description: 'Khóa học nhập môn về các tư thế, thế tấn và kỹ thuật cơ bản của Vovinam.',
            category: 'Vovinam',
            thumbnail: './assets/images/courses/vovinam_cb.jpg',
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            theory_url: 'https://docs.google.com/document/d/1FAGHDPYsAlvV2pcg77kYY3yFsglInz_adRnTDYqoZ6A/edit?usp=sharing'
        },
        {
            _id: '507f1f77bcf86cd799439016',
            title: 'Vovinam Nâng Cao',
            description: 'Khóa học nâng cao về các đòn tấn công, phản đòn và tự vệ trong Vovinam.',
            category: 'Vovinam',
            thumbnail: './assets/images/courses/vovinam_nc.jpg',
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            theory_url: 'https://docs.google.com/document/d/e/2PACX-1vQw_7WLcUWLEJUUxbPUJdBJT7k2qgRBQyM-cXwU-XAJRpqPcKgFYQ_YvxQkYsoXbQ/pub?embedded=true'
        }
    ];

    // If it's a specific course request, return just that course
    if (courseId) {
        const course = mockCourses.find(c => c._id === courseId);
        if (course) {
            return {
                ok: true,
                status: 200,
                json: async () => course
            };
        } else {
            return {
                ok: false,
                status: 404,
                json: async () => ({ message: 'Course not found' })
            };
        }
    }

    // Filter by category if specified
    let filteredCourses = mockCourses;
    if (category) {
        filteredCourses = mockCourses.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => filteredCourses
    };

    return mockResponse;
}

async function mockTeacherStudentsResponse() {
    // Use real user data from the database
    const mockData = [
        {
            _id: '67cb2333d57fd05d715ba597',
            name: 'Chiến Dev',
            email: 'test@example.com',
            avatar: '/uploads/avatars/avatar_67cb2333d57fd05d715ba597_1744317180.jpg',
            level: 3,
            progress: 57,
            points: 284,
            loginStreak: 5,
            achievements: ['Tân Binh', 'Học Viên Chăm Chỉ'],
            lastLogin: '2025-04-17T09:13:21.555Z',
            createdAt: '2025-03-07T16:47:47.192Z'
        },
        {
            _id: '67bf602ca625849aa40f1953',
            name: 'Nguyễn Văn A',
            email: 'student@fpt.edu.vn',
            avatar: 'https://picsum.photos/150',
            level: 1,
            progress: 30,
            points: 50,
            loginStreak: 0,
            achievements: [],
            lastLogin: '2025-02-26T18:40:44.515Z',
            createdAt: '2025-02-26T18:40:44.515Z'
        },
        {
            _id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Nguyen Van A',
            email: 'user@example.com',
            avatar: '/uploads/avatars/123e4567-e89b-12d3-a456-426614174000_avatar.jpg',
            level: 1,
            progress: 0,
            points: 0,
            loginStreak: 0,
            achievements: [],
            lastLogin: null,
            createdAt: null
        },
        {
            _id: '67cc44f590085e1172a29be8',
            name: 'dev',
            email: 'test1@example.com',
            avatar: 'https://picsum.photos/50',
            level: 1,
            progress: 8,
            points: 65,
            loginStreak: 2,
            achievements: ['Tân Binh'],
            lastLogin: '2025-04-15T19:40:41.941Z',
            createdAt: '2025-03-08T13:24:05.630Z'
        },
        {
            _id: '67fd090d69bd78dd6325bed5',
            name: 'Chiến Test',
            email: 'quangchienaz3@gmail.com',
            avatar: 'https://ui-avatars.com/api/?name=Chien+Test&background=random&color=fff&size=150',
            level: 1,
            progress: 12,
            points: 70,
            loginStreak: 2,
            achievements: ['Tân Binh'],
            lastLogin: '2025-04-15T15:50:50.593Z',
            createdAt: '2025-04-14T13:09:33.338Z'
        },
        {
            _id: '67feb9d1ede29e99b22a14ce',
            name: 'Top1 nè',
            email: 'quangchienaz@gmail.com',
            avatar: '/uploads/avatars/avatar_67feb9d1ede29e99b22a14ce_1744748024.jpg',
            level: 1,
            progress: 19,
            points: 87,
            loginStreak: 1,
            achievements: ['Tân Binh'],
            lastLogin: '2025-04-16T09:47:39.466Z',
            createdAt: '2025-04-15T19:56:01.635Z'
        },
        {
            _id: '67fff6f3538942ec0f731d58',
            name: 'Tan Phap',
            email: 'letanphap6543@gmail.com',
            avatar: 'https://ui-avatars.com/api/?name=Tan+Phap&background=random&color=fff&size=150',
            level: 1,
            progress: 0,
            points: 0,
            loginStreak: 0,
            achievements: [],
            lastLogin: null,
            createdAt: '2025-04-16T18:29:07.424Z'
        },
        {
            _id: '6800bb4425a865f02762cde5',
            name: 'Học viên',
            email: 'studenttest@fpt.edu.vn',
            avatar: 'https://ui-avatars.com/api/?name=Hoc+vien&background=random&color=fff&size=150',
            level: 1,
            progress: 0,
            points: 0,
            loginStreak: 0,
            achievements: [],
            lastLogin: null,
            createdAt: '2025-04-17T08:26:44.561Z'
        }
    ];

    // Filter out teachers
    const studentsOnly = mockData.filter(user => user._id !== '987fcdeb-54a3-21e4-b567-891011223344' && user._id !== '67cc3fe61a774eaa8eb3730c');

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => studentsOnly
    };

    return mockResponse;
}

async function mockFeedbackNotifyResponse() {
    // Create mock feedback notification response
    const mockData = {
        success: true,
        message: 'Notification sent successfully'
    };

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData
    };

    return mockResponse;
}

async function mockStudentProgressResponse(endpoint) {
    // Extract student ID from endpoint
    const parts = endpoint.split('/api/teacher/students/')[1].split('/progress');
    const studentId = parts[0];

    // Create mock response for progress update
    const mockData = {
        message: 'Student progress updated successfully',
        student: {
            _id: studentId,
            name: 'Mock Student',
            email: 'mockstudent@example.com',
            progress: 0 // This will be updated with the actual value from the request
        }
    };

    // Try to parse the request body to get the progress value
    try {
        // Get the request body from the last API call
        const lastRequestBody = JSON.parse(lastRequestData?.body || '{}');
        if (lastRequestBody && typeof lastRequestBody.progress === 'number') {
            mockData.student.progress = lastRequestBody.progress;
        }

        // Update the student in teacherStudents array if available
        if (teacherStudents && teacherStudents.length > 0) {
            const studentIndex = teacherStudents.findIndex(s => s._id === studentId);
            if (studentIndex !== -1) {
                teacherStudents[studentIndex].progress = mockData.student.progress;
                mockData.student.name = teacherStudents[studentIndex].name || mockData.student.name;
                mockData.student.email = teacherStudents[studentIndex].email || mockData.student.email;
            }
        }
    } catch (e) {
        console.error('Error parsing request body for progress update:', e);
    }

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData
    };

    return mockResponse;
}

async function mockUserProgressResponse(endpoint) {
    // Extract user ID from endpoint
    const parts = endpoint.split('/api/users/')[1].split('/progress');
    const userId = parts[0];

    // Create mock response for progress update
    const mockData = {
        message: 'User progress updated successfully',
        user: {
            _id: userId,
            name: 'Mock User',
            email: 'mockuser@example.com',
            progress: 0 // This will be updated with the actual value from the request
        }
    };

    // Try to parse the request body to get the progress value
    try {
        // Get the request body from the last API call
        const lastRequestBody = JSON.parse(lastRequestData?.body || '{}');
        if (lastRequestBody && typeof lastRequestBody.progress === 'number') {
            mockData.user.progress = lastRequestBody.progress;
        }

        // Update the student in teacherStudents array if available
        if (teacherStudents && teacherStudents.length > 0) {
            const studentIndex = teacherStudents.findIndex(s => s._id === userId);
            if (studentIndex !== -1) {
                teacherStudents[studentIndex].progress = mockData.user.progress;
                mockData.user.name = teacherStudents[studentIndex].name || mockData.user.name;
                mockData.user.email = teacherStudents[studentIndex].email || mockData.user.email;
            }
        }
    } catch (e) {
        console.error('Error parsing request body for progress update:', e);
    }

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData
    };

    return mockResponse;
}

async function mockPersonalCoursesResponse(endpoint, options = {}) {
    console.log('Mock personal courses response', endpoint, options);

    // Check if it's a POST request to add a course to favorites
    if (options.method === 'POST') {
        try {
            // Parse the request body to get the courseId
            const requestData = JSON.parse(options.body || '{}');
            const courseId = requestData.courseId;

            // Validate the courseId
            if (!courseId || courseId.length !== 24) {
                return {
                    ok: false,
                    status: 400,
                    json: async () => ({ message: 'Valid Course ID required' })
                };
            }

            // Add the course to the user's personal courses
            if (!currentUser.personalCourses) {
                currentUser.personalCourses = [];
            }

            // Only add if not already in the list
            if (!currentUser.personalCourses.includes(courseId)) {
                currentUser.personalCourses.push(courseId);
            }

            // Update the personalCourseIds array
            personalCourseIds = currentUser.personalCourses;

            return {
                ok: true,
                status: 200,
                json: async () => ({ user: currentUser })
            };
        } catch (error) {
            console.error('Error in mock personal courses POST:', error);
            return {
                ok: false,
                status: 400,
                json: async () => ({ message: error.message || 'Invalid request data' })
            };
        }
    }

    // Check if it's a DELETE request to remove a course from favorites
    if (options.method === 'DELETE') {
        try {
            // Extract course ID from the endpoint
            const courseId = endpoint.split('/api/users/personal-courses/')[1];

            // Validate the courseId
            if (!courseId || courseId.length !== 24) {
                return {
                    ok: false,
                    status: 400,
                    json: async () => ({ message: 'Valid Course ID required' })
                };
            }

            // Remove the course from the user's personal courses
            if (currentUser.personalCourses) {
                currentUser.personalCourses = currentUser.personalCourses.filter(id => id !== courseId);
            }

            // Update the personalCourseIds array
            personalCourseIds = currentUser.personalCourses;

            return {
                ok: true,
                status: 200,
                json: async () => ({ user: currentUser })
            };
        } catch (error) {
            console.error('Error in mock personal courses DELETE:', error);
            return {
                ok: false,
                status: 400,
                json: async () => ({ message: error.message || 'Invalid request data' })
            };
        }
    }

    // Default response for GET requests
    return {
        ok: true,
        status: 200,
        json: async () => currentUser.personalCourses || []
    };
}

async function mockUserDetailsResponse(endpoint) {
    // Extract user ID from endpoint
    const userId = endpoint.split('/api/users/')[1];

    // Create mock student data based on user ID with real data
    const mockUsers = {
        '67cb2333d57fd05d715ba597': {
            _id: '67cb2333d57fd05d715ba597',
            name: 'Chiến Dev',
            email: 'test@example.com',
            avatar: '/uploads/avatars/avatar_67cb2333d57fd05d715ba597_1744317180.jpg',
            level: 3,
            progress: 57,
            points: 284,
            loginStreak: 5,
            courses: ['Sáo Trúc Cơ Bản', 'Vovinam Nhập Môn'],
            lastActive: '2025-04-17T09:13:21.555Z',
            joinDate: '2025-03-07T16:47:47.192Z',
            achievements: ['Tân Binh', 'Học Viên Chăm Chỉ']
        },
        '67bf602ca625849aa40f1953': {
            _id: '67bf602ca625849aa40f1953',
            name: 'Nguyễn Văn A',
            email: 'student@fpt.edu.vn',
            avatar: 'https://picsum.photos/150',
            level: 1,
            progress: 30,
            points: 50,
            loginStreak: 0,
            courses: [],
            lastActive: '2025-02-26T18:40:44.515Z',
            joinDate: '2025-02-26T18:40:44.515Z',
            achievements: []
        },
        '123e4567-e89b-12d3-a456-426614174000': {
            _id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Nguyen Van A',
            email: 'user@example.com',
            avatar: '/uploads/avatars/123e4567-e89b-12d3-a456-426614174000_avatar.jpg',
            level: 1,
            progress: 0,
            points: 0,
            loginStreak: 0,
            courses: [],
            lastActive: new Date().toISOString(),
            joinDate: new Date().toISOString(),
            achievements: []
        },
        '67cc44f590085e1172a29be8': {
            _id: '67cc44f590085e1172a29be8',
            name: 'dev',
            email: 'test1@example.com',
            avatar: 'https://picsum.photos/50',
            level: 1,
            progress: 8,
            points: 65,
            loginStreak: 2,
            courses: [],
            lastActive: '2025-04-15T19:40:41.941Z',
            joinDate: '2025-03-08T13:24:05.630Z',
            achievements: ['Tân Binh']
        },
        '67fd090d69bd78dd6325bed5': {
            _id: '67fd090d69bd78dd6325bed5',
            name: 'Chiến Test',
            email: 'quangchienaz3@gmail.com',
            avatar: 'https://ui-avatars.com/api/?name=Chien+Test&background=random&color=fff&size=150',
            level: 1,
            progress: 12,
            points: 70,
            loginStreak: 2,
            courses: [],
            lastActive: '2025-04-15T15:50:50.593Z',
            joinDate: '2025-04-14T13:09:33.338Z',
            achievements: ['Tân Binh']
        },
        '67feb9d1ede29e99b22a14ce': {
            _id: '67feb9d1ede29e99b22a14ce',
            name: 'Top1 nè',
            email: 'quangchienaz@gmail.com',
            avatar: '/uploads/avatars/avatar_67feb9d1ede29e99b22a14ce_1744748024.jpg',
            level: 1,
            progress: 19,
            points: 87,
            loginStreak: 1,
            courses: [],
            lastActive: '2025-04-16T09:47:39.466Z',
            joinDate: '2025-04-15T19:56:01.635Z',
            achievements: ['Tân Binh']
        },
        '67fff6f3538942ec0f731d58': {
            _id: '67fff6f3538942ec0f731d58',
            name: 'Tan Phap',
            email: 'letanphap6543@gmail.com',
            avatar: 'https://ui-avatars.com/api/?name=Tan+Phap&background=random&color=fff&size=150',
            level: 1,
            progress: 0,
            points: 0,
            loginStreak: 0,
            courses: [],
            lastActive: new Date().toISOString(),
            joinDate: '2025-04-16T18:29:07.424Z',
            achievements: []
        },
        '6800bb4425a865f02762cde5': {
            _id: '6800bb4425a865f02762cde5',
            name: 'Học viên',
            email: 'studenttest@fpt.edu.vn',
            avatar: 'https://ui-avatars.com/api/?name=Hoc+vien&background=random&color=fff&size=150',
            level: 1,
            progress: 0,
            points: 0,
            loginStreak: 0,
            courses: [],
            lastActive: new Date().toISOString(),
            joinDate: '2025-04-17T08:26:44.561Z',
            achievements: []
        }
    };

    // Get the user data or return a default if not found
    const userData = mockUsers[userId] || {
        _id: userId,
        name: 'Student',
        email: 'unknown@example.com',
        avatar: './assets/images/avatars/default.jpg',
        level: 1,
        progress: 0,
        points: 0,
        loginStreak: 0,
        courses: [],
        lastActive: new Date().toISOString(),
        joinDate: new Date().toISOString(),
        achievements: []
    };

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => userData
    };

    return mockResponse;
}

async function mockSubmissionsResponse() {
    // Create mock submissions data directly as an array to match MongoDB format
    const mockData = [
        {
            _id: 'sub1',
            userId: 'user1',
            userName: 'Nguyễn Văn A',
            userEmail: 'nguyenvana@example.com',
            type: 'challenge',
            url: './assets/images/submissions/challenge1.jpg',
            originalFilename: 'challenge1.jpg',
            relatedTitle: 'Thử thách hôm nay: Giai điệu dân gian',
            note: 'Em đã hoàn thành thử thách với bài dân ca Bắc Bộ',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'pending',
            challengePoints: 50
        },
        {
            _id: 'sub2',
            userId: 'user2',
            userName: 'Trần Thị B',
            userEmail: 'tranthib@example.com',
            type: 'practice',
            url: './assets/images/submissions/practice1.mp4',
            originalFilename: 'practice1.mp4',
            relatedTitle: 'Bài tập sáo trúc cơ bản',
            note: 'Em đã luyện tập kỹ thuật thổi sáo cơ bản',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            status: 'pending'
        },
        {
            _id: 'sub3',
            userId: 'user3',
            userName: 'Lê Văn C',
            userEmail: 'levanc@example.com',
            type: 'challenge',
            url: './assets/images/submissions/challenge2.jpg',
            originalFilename: 'challenge2.jpg',
            relatedTitle: 'Thử thách hôm nay: Kỹ thuật cơ bản',
            note: 'Em đã thực hiện các kỹ thuật cơ bản của Vovinam',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            status: 'pending',
            challengePoints: 40
        },
        {
            _id: 'sub4',
            userId: 'user4',
            userName: 'Phạm Thị D',
            userEmail: 'phamthid@example.com',
            type: 'challenge',
            url: './assets/images/submissions/challenge3.mp4',
            originalFilename: 'challenge3.mp4',
            relatedTitle: 'Thử thách hôm nay: Biểu diễn',
            note: 'Em đã thực hiện bài biểu diễn với đàn tranh',
            createdAt: new Date(Date.now() - 43200000).toISOString(),
            status: 'pending',
            challengePoints: 60
        }
    ];

    // Create a mock response object
    const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData
    };

    return mockResponse;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Ready - Initializing FPT Learning Hub");
    setupEventListeners(); initParticles(); initLanguageToggle(); applyTheme(); setupIntersectionObserver();
    loadInitialData(); initChatbot(); setupTeacherChallengeActions();
});

function initParticles() {
    /* Enhanced particle effects */
    if (typeof particlesJS === 'undefined') {
        console.error('particlesJS not loaded');
        return;
    }

    try {
        // Hero particles config
        const heroParticles = document.getElementById('particles-js');
        if (heroParticles) {
            particlesJS('particles-js', {
                particles: {
                    number: {
                        value: 120,
                        density: {
                            enable: true,
                            value_area: 900
                        }
                    },
                    color: {
                        value: ['#ffffff', '#ffcc00', '#ffaa00']
                    },
                    shape: {
                        type: ['circle', 'triangle', 'star'],
                        stroke: {
                            width: 0,
                            color: '#000000'
                        },
                        polygon: {
                            nb_sides: 5
                        }
                    },
                    opacity: {
                        value: 0.7,
                        random: true,
                        anim: {
                            enable: true,
                            speed: 1,
                            opacity_min: 0.1,
                            sync: false
                        }
                    },
                    size: {
                        value: 4,
                        random: true,
                        anim: {
                            enable: true,
                            speed: 2,
                            size_min: 0.5,
                            sync: false
                        }
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: '#ffcc00',
                        opacity: 0.2,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 3,
                        direction: 'none',
                        random: true,
                        straight: false,
                        out_mode: 'out',
                        bounce: false,
                        attract: {
                            enable: true,
                            rotateX: 600,
                            rotateY: 1200
                        }
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: {
                            enable: true,
                            mode: 'bubble'
                        },
                        onclick: {
                            enable: true,
                            mode: 'push'
                        },
                        resize: true
                    },
                    modes: {
                        grab: {
                            distance: 140,
                            line_linked: {
                                opacity: 1
                            }
                        },
                        bubble: {
                            distance: 200,
                            size: 6,
                            duration: 2,
                            opacity: 0.8,
                            speed: 3
                        },
                        repulse: {
                            distance: 150,
                            duration: 0.4
                        },
                        push: {
                            particles_nb: 4
                        },
                        remove: {
                            particles_nb: 2
                        }
                    }
                },
                retina_detect: true
            });
        }

        // Ranking particles config
        const rankingParticles = document.getElementById('particles-js-ranking');
        if (rankingParticles) {
            particlesJS('particles-js-ranking', {
                particles: {
                    number: {
                        value: 70,
                        density: {
                            enable: true,
                            value_area: 900
                        }
                    },
                    color: {
                        value: ["#facc15", "#fb923c", "#f87171", "#ffcc00"]
                    },
                    shape: {
                        type: ['star', 'circle', 'triangle'],
                        stroke: {
                            width: 0,
                            color: '#000000'
                        }
                    },
                    opacity: {
                        value: 0.8,
                        random: true,
                        anim: {
                            enable: true,
                            speed: 1,
                            opacity_min: 0.3,
                            sync: false
                        }
                    },
                    size: {
                        value: 5,
                        random: true,
                        anim: {
                            enable: true,
                            speed: 2,
                            size_min: 1,
                            sync: false
                        }
                    },
                    line_linked: {
                        enable: false
                    },
                    move: {
                        enable: true,
                        speed: 3.5,
                        direction: 'bottom-left',
                        random: true,
                        straight: false,
                        out_mode: 'out',
                        bounce: false,
                        attract: {
                            enable: true,
                            rotateX: 600,
                            rotateY: 1200
                        }
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: {
                            enable: true,
                            mode: 'bubble'
                        },
                        onclick: {
                            enable: true,
                            mode: 'repulse'
                        },
                        resize: true
                    },
                    modes: {
                        bubble: {
                            distance: 150,
                            size: 8,
                            duration: 2,
                            opacity: 0.8,
                            speed: 3
                        },
                        repulse: {
                            distance: 150,
                            duration: 0.4
                        }
                    }
                },
                retina_detect: true
            });
        }

        // Profile particles config
        const profileParticles = document.getElementById('particles-js-profile');
        if (profileParticles) {
            particlesJS('particles-js-profile', {
                particles: {
                    number: {
                        value: 50,
                        density: {
                            enable: true,
                            value_area: 800
                        }
                    },
                    color: {
                        value: ['#1e40af', '#facc15', '#3b82f6']
                    },
                    shape: {
                        type: ['circle', 'triangle', 'polygon'],
                        stroke: {
                            width: 0,
                            color: '#000000'
                        },
                        polygon: {
                            nb_sides: 6
                        }
                    },
                    opacity: {
                        value: 0.5,
                        random: true,
                        anim: {
                            enable: true,
                            speed: 1,
                            opacity_min: 0.1,
                            sync: false
                        }
                    },
                    size: {
                        value: 5,
                        random: true,
                        anim: {
                            enable: true,
                            speed: 2,
                            size_min: 0.5,
                            sync: false
                        }
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: '#facc15',
                        opacity: 0.2,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 2,
                        direction: 'none',
                        random: true,
                        straight: false,
                        out_mode: 'out',
                        bounce: false,
                        attract: {
                            enable: true,
                            rotateX: 600,
                            rotateY: 1200
                        }
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: {
                            enable: true,
                            mode: 'grab'
                        },
                        onclick: {
                            enable: true,
                            mode: 'push'
                        },
                        resize: true
                    },
                    modes: {
                        grab: {
                            distance: 140,
                            line_linked: {
                                opacity: 0.8
                            }
                        },
                        bubble: {
                            distance: 200,
                            size: 6,
                            duration: 2,
                            opacity: 0.8,
                            speed: 3
                        },
                        repulse: {
                            distance: 150,
                            duration: 0.4
                        },
                        push: {
                            particles_nb: 4
                        },
                        remove: {
                            particles_nb: 2
                        }
                    }
                },
                retina_detect: true
            });
        }
    } catch (e) {
        console.error("ParticlesJS error:", e);
    }
}

async function loadInitialData() {
    showLoading();
    try {
        await fetchUserProfile();
        await fetchCourses();

        if (currentUser) {
            const dataFetchPromises = [
                fetchLearningPath(), fetchUserFeedback(), initFlashcards(),
                initChallenges(), fetchPersonalCoursesData(), fetchInitialRankings(),
                fetchUserNotifications()
                // loadChatHistory() - Đã loại bỏ để tránh hiển thị tin nhắn chào nhiều lần
            ];
            if (currentUser.role === 'teacher') {
                dataFetchPromises.push(fetchTeacherSubmissions(), fetchTeacherAnalytics());
            }
            await Promise.all(dataFetchPromises);
            startRankingUpdatesSSE(); // Start SSE after initial fetches complete
        } else {
            clearPersonalCoursesUI(); clearLearningPathUI(); clearUserFeedbackUI();
            renderFlashcardUI(); renderChallenge(null); renderRanking([]);
            clearTeacherSubmissionsUI(); clearTeacherAnalyticsUI(); clearTeacherStudentsUI();
            clearChatbotUI(); appendChatMessage(getTranslation('chatbot-login-prompt'), 'bot');
        }
        resetToHomePage();
    } catch (error) {
        console.error("Initial data load error:", error);
        if (error.message !== getTranslation('session-expired')) {
            showNotification(getTranslation('error-loading-data'), 'error');
        }
        resetToHomePage();
    } finally {
        hideLoading();
    }
}

// --- Event Listeners Setup ---
function setupEventListeners() { console.log("Setting up listeners..."); /* Keep all listener setups */ document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme); document.querySelector('.logo')?.addEventListener('click', resetToHomePage); document.querySelector('.hamburger')?.addEventListener('click', toggleMobileMenu); document.getElementById('language-toggle')?.addEventListener('click', toggleLanguage); document.getElementById('search')?.addEventListener('input', debounce(handleSearch, 300));

    // Add event listeners for mini-game cards and difficulty buttons
    document.addEventListener('click', handleMiniGameCardClick);
    document.getElementById('submit-game')?.addEventListener('click', submitMiniGameAnswer);

    // Add direct event listeners for difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            console.log('Direct difficulty button click:', this.dataset.gameType, this.dataset.level);
            e.stopPropagation();
            e.preventDefault();

            if (!currentUser) {
                showNotification(getTranslation('please-login-game'), 'error');
                openAuthModal(true);
                return;
            }

            const gameType = this.dataset.gameType;
            const level = this.dataset.level;
            startMiniGame(gameType, level);
        });
    });

    // Add event listeners for all close-modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'mini-game-modal') {
                closeMiniGameModal();
            } else {
                animateModalClose(modal);
            }
        });
    });

    // Add global event listener for theory size adjustment buttons
    document.addEventListener('click', handleTheorySizeAdjustment);

    // Add global event listener for course action buttons
    document.addEventListener('click', handleCourseActionClick);

    // Add event listener to close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.learn-dropdown')) {
            document.querySelectorAll('.learn-options.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });

    // Add drag and drop event listeners for personal courses
    const personalCoursesGrid = document.getElementById('personal-courses-grid');
    if (personalCoursesGrid) {
        personalCoursesGrid.addEventListener('dragover', handleDragOver);
        personalCoursesGrid.addEventListener('dragleave', handleDragLeave);
        personalCoursesGrid.addEventListener('drop', handleDropOnPersonalCourses);
    }

    // Add drag start event listener to all draggable elements
    document.addEventListener('dragstart', handleDragStart);
    // Thêm sự kiện click cho các liên kết trong menu chính
    document.querySelectorAll('.nav-menu a').forEach(link => link.addEventListener('click', handleNavClick));

    // Teacher dashboard tabs
    document.querySelectorAll('.teacher-tab-btn').forEach(tab => {
        tab.addEventListener('click', handleTeacherTabClick);
    });

    // Thêm sự kiện click cho các liên kết trong footer
    document.querySelectorAll('.footer-links a').forEach(link => {
        if (link.dataset.section) {
            link.addEventListener('click', handleNavClick);
        }
    });

    document.addEventListener('click', (e) => { const m=document.querySelector('.nav-menu'); const h=document.querySelector('.hamburger'); if (m?.classList.contains('active') && !m.contains(e.target) && !h?.contains(e.target)) toggleMobileMenu(); }); document.querySelector('.cta-btn')?.addEventListener('click', () => showLearningPage()); document.getElementById('login-btn')?.addEventListener('click', () => openAuthModal(true)); document.getElementById('signup-btn')?.addEventListener('click', () => openAuthModal(false)); document.getElementById('logout-btn')?.addEventListener('click', logout); const authModal=document.getElementById('auth-modal'); if(authModal){authModal.querySelector('.close-modal')?.addEventListener('click', closeAuthModal); authModal.querySelector('#toggle-link')?.addEventListener('click', (e)=>{e.preventDefault(); openAuthModal(authModal.querySelector('#modal-title').dataset.translate !== 'login');}); authModal.querySelector('#auth-form')?.addEventListener('submit', handleAuthSubmit);} document.getElementById('user-avatar')?.addEventListener('click', () => showSection('profile')); document.getElementById('profile-view')?.addEventListener('click', handleProfileViewClick); document.getElementById('avatar-upload')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);
            handleAvatarUpload({ preventDefault: () => {}, formData });
        }
    });
    document.getElementById('avatar-file')?.addEventListener('change', handleAvatarFileSelect);
    document.getElementById('avatar-upload-form')?.addEventListener('submit', handleAvatarUpload);
    document.getElementById('cancel-avatar-upload')?.addEventListener('click', closeAvatarUploadModal); document.getElementById('edit-profile-form-inputs')?.addEventListener('submit', handleProfileEditSubmit); document.querySelector('#edit-profile-form .cancel-btn')?.addEventListener('click', () => toggleEditProfile(false)); const pwModal=document.getElementById('change-password-modal'); if(pwModal){pwModal.querySelector('.close-modal')?.addEventListener('click', closeChangePasswordModal); pwModal.querySelector('#change-password-form')?.addEventListener('submit', handleChangePasswordSubmit);} document.getElementById('instrument-grid')?.addEventListener('click', handleCourseActionClick); document.getElementById('martial-grid')?.addEventListener('click', handleCourseActionClick); const drop=document.getElementById('personal-courses-grid'); if(drop){drop.addEventListener('dragover', handleDragOver); drop.addEventListener('dragleave', handleDragLeave); drop.addEventListener('drop', handleDropOnPersonalCourses); drop.addEventListener('click', handleCourseActionClick);} document.addEventListener('dragstart', handleDragStart); document.getElementById('flashcard-category')?.addEventListener('change', handleFlashcardCategoryChange); document.getElementById('flashcard')?.addEventListener('click', flipFlashcard); document.getElementById('prev-card')?.addEventListener('click', prevFlashcard); document.getElementById('next-card')?.addEventListener('click', nextFlashcard); document.getElementById('random-test-btn')?.addEventListener('click', () => openFlashcardTestModal(true)); document.getElementById('test-flashcard')?.addEventListener('click', () => openFlashcardTestModal(false)); document.getElementById('save-progress-btn')?.addEventListener('click', saveFlashcardProgress); document.getElementById('mark-known')?.addEventListener('click', toggleCardKnownStatus); document.getElementById('shuffle-cards')?.addEventListener('click', shuffleFlashcards);

    // Add keyboard support for flashcards
    document.addEventListener('keydown', function(e) {
        if (currentSection === 'flashcards') {
            if (e.key === ' ' || e.key === 'Spacebar') {
                // Space to flip card
                e.preventDefault();
                flipFlashcard();
            } else if (e.key === 'ArrowRight') {
                // Right arrow for next card
                e.preventDefault();
                nextFlashcard();
            } else if (e.key === 'ArrowLeft') {
                // Left arrow for previous card
                e.preventDefault();
                prevFlashcard();
            } else if (e.key === 'k' || e.key === 'K') {
                // K to mark as known
                e.preventDefault();
                toggleCardKnownStatus();
            }
        }
    });

    // Use the handleFlashcardKeyboard function we defined earlier
    document.addEventListener('keydown', handleFlashcardKeyboard); const fcModal=document.getElementById('flashcard-test-modal'); if(fcModal){fcModal.querySelector('.close-modal')?.addEventListener('click', closeFlashcardTestModal); fcModal.querySelector('#submit-test')?.addEventListener('click', submitFlashcardTest);} document.getElementById('challenge-submission-form')?.addEventListener('submit', handleChallengeSubmit); document.getElementById('challenge-file')?.addEventListener('change', displaySelectedFileName); document.getElementById('mini-game-grid')?.addEventListener('click', handleMiniGameCardClick); const gameModal=document.getElementById('mini-game-modal'); if(gameModal){gameModal.querySelector('.close-modal')?.addEventListener('click', closeMiniGameModal); gameModal.querySelector('#submit-game')?.addEventListener('click', submitMiniGameAnswer); gameModal.querySelector('#game-answer')?.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitMiniGameAnswer(); } }); } document.querySelector('.scroll-down-btn')?.addEventListener('mousedown', startScrollRankingDown); document.querySelector('.scroll-down-btn')?.addEventListener('mouseup', stopScrollRanking); document.querySelector('.scroll-down-btn')?.addEventListener('mouseleave', stopScrollRanking); document.querySelector('.scroll-up-btn')?.addEventListener('mousedown', startScrollRankingUp); document.querySelector('.scroll-up-btn')?.addEventListener('mouseup', stopScrollRanking); document.querySelector('.scroll-up-btn')?.addEventListener('mouseleave', stopScrollRanking); document.getElementById('ranking-list')?.addEventListener('scroll', debounce(updateRankingScrollButtons, 100)); document.getElementById('feedback-list')?.addEventListener('submit', handleReviewSubmit); document.getElementById('feedback-form')?.addEventListener('submit', handleFeedbackSubmit); document.getElementById('chatbot-toggle')?.addEventListener('click', toggleChatbot);
    document.getElementById('open-chatbot')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleChatbot();
    });
document.querySelector('#chatbot .chatbot-close')?.addEventListener('click', toggleChatbot);
// Make sure all chatbot header buttons are clickable
document.querySelectorAll('#chatbot .chatbot-header .header-buttons button').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        const id = this.id;

        // Handle each button based on its ID
        if (id === 'toggle-speech-btn') {
            toggleSpeechOutput();
        } else if (id === 'export-history-btn') {
            exportChatHistory();
        } else if (id === 'clear-cache-btn') {
            clearChatbotCacheAndHistory();
        } else if (this.classList.contains('chatbot-close')) {
            toggleChatbot();
        }
    });
}); document.getElementById('send-msg')?.addEventListener('click', () => sendChatMessage()); document.getElementById('chat-input')?.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }); document.getElementById('start-speech-btn')?.addEventListener('click', toggleSpeechRecognition); document.getElementById('toggle-speech-btn')?.addEventListener('click', toggleSpeechOutput); document.getElementById('export-history-btn')?.addEventListener('click', exportChatHistory); document.getElementById('clear-cache-btn')?.addEventListener('click', clearChatbotCacheAndHistory); console.log("Listeners setup complete."); }

// --- Theme ---
function applyTheme() {
    const t=localStorage.getItem('theme')||'light';
    document.body.className=t;
    const b=document.querySelector('.theme-toggle');

    if(b) {
        const d=t==='dark';
        const k=d?'toggle-light-mode':'toggle-dark-mode';
        b.dataset.translate=k;
        b.title=getTranslation(k);

        // Handle the new theme toggle icons
        if (d) {
            b.classList.add('dark-mode');
        } else {
            b.classList.remove('dark-mode');
        }
    }

    console.log(`Theme: ${t}`);
}
function toggleTheme() {
    const n=document.body.classList.contains('dark')?'light':'dark';
    localStorage.setItem('theme',n);
    applyTheme();
    showNotification(getTranslation(n==='dark'?'dark-mode-enabled':'light-mode-enabled'),'info');

    // Update theme toggle button animation
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        if (n === 'dark') {
            themeToggle.classList.add('dark-mode');
        } else {
            themeToggle.classList.remove('dark-mode');
        }
    }
}

// --- Language ---
function initLanguageToggle() { const l=localStorage.getItem('language')||'vi'; currentLanguage=l; updateLanguageUI(); applyTranslations(); if(recognition)recognition.lang=l==='vi'?'vi-VN':'en-US'; }
function toggleLanguage() { currentLanguage=currentLanguage==='vi'?'en':'vi'; localStorage.setItem('language',currentLanguage); updateLanguageUI(); applyTranslations(); showNotification(getTranslation('language-changed'),'success'); if(recognition)recognition.lang=currentLanguage==='vi'?'vi-VN':'en-US'; if(synthesis?.speaking)synthesis.cancel(); if(document.getElementById('chatbot')?.style.display==='flex'){clearChatbotUI();appendChatMessage(getTranslation(currentUser?'chatbot-welcome':'chatbot-login-prompt'),'bot');} if(currentUser){updateProfileUI();renderRanking(rankings);renderUserFeedbackList(userFeedbackList);if(currentUser.role==='teacher'){fetchTeacherSubmissions();fetchTeacherAnalytics();}} renderChallenge(currentDailyChallenge); renderFlashcardUI();
    // Update language toggle button icon
    const langToggle = document.getElementById('language-toggle');
    if (langToggle) {
        langToggle.setAttribute('data-lang', currentLanguage);
    }
}
function updateLanguageUI() { const el=document.getElementById('lang-text'); if(el)el.textContent=currentLanguage.toUpperCase(); document.documentElement.lang=currentLanguage; }
function applyTranslations(el=document.body){el.querySelectorAll('[data-translate]').forEach(e=>{const k=e.dataset.translate;if(!e.matches('#profile-name,#profile-role-text,#profile-email-link,#points-value,#level-value,#streak-value,#progress-text,#flashcard-progress-text,#flashcard-score,.rank-name,.rank-points,.rank-level,.flashcard-front p,.flashcard-back p'))e.textContent=getTranslation(k);if(e.dataset.translateTitle==='true')e.title=getTranslation(k);});el.querySelectorAll('[data-translate-placeholder]').forEach(e=>{e.placeholder=getTranslation(e.dataset.translatePlaceholder);});const tb=document.querySelector('.theme-toggle');if(tb){const dark=document.body.classList.contains('dark');tb.title=getTranslation(dark?'toggle-light-mode':'toggle-dark-mode');}}

// --- Navigation & Section Handling ---
function toggleMobileMenu() { document.querySelector('.nav-menu')?.classList.toggle('active'); document.querySelector('.hamburger')?.classList.toggle('active'); }
function handleNavClick(e) { e.preventDefault(); const link = e.target.closest('a'); if (!link) return; const id = link.dataset.section; if (document.querySelector('.nav-menu')?.classList.contains('active')) toggleMobileMenu(); if (!id) { if(link.href && link.target === '_blank') window.open(link.href, '_blank'); return; } const restricted = ['flashcards', 'ranking', 'challenges', 'mini-games', 'teacher-dashboard', 'feedback', 'profile']; if (restricted.includes(id) && !currentUser) { showNotification(getTranslation('please-login'), 'error'); openAuthModal(true); return; } if (id === 'teacher-dashboard' && currentUser?.role !== 'teacher') { showNotification(getTranslation('no-access-teacher'), 'warning'); return; } if (['explore', 'instruments', 'martial-arts'].includes(id)) showLearningPage(['instruments', 'martial-arts'].includes(id) ? id : null); else showSection(id); }
function showSection(id) {
    console.log(`Show: ${id}`); document.querySelectorAll('.section, .hero, #learning-page').forEach(el => el.style.display = 'none');
    const section = document.getElementById(id);
    if (section) {
        // Update current section tracking
        currentSection = id;

        section.style.display = id === 'hero-section' ? 'flex' : 'block';
        const rect = section.getBoundingClientRect(); if (rect.top < -10 || rect.bottom > window.innerHeight + 10) section.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Scroll only if needed
        if (!section.dataset.animated) animateSectionEntry(section.querySelector('.container') || section);
        // Refresh section-specific data
        switch (id) {
            case 'profile': fetchUserProfile(); break; // Always fetch latest on view
            case 'ranking': fetchInitialRankings().then(() => startRankingUpdatesSSE()); break; // Fetch snapshot then start SSE
            case 'flashcards': if (currentUser && Object.keys(appFlashcardsData).length === 0) initFlashcards(); else renderFlashcardUI(); break;
            case 'challenges': if (currentUser) fetchDailyChallenge(); else renderChallenge(null); break;
            case 'learning-path': if (currentUser) fetchLearningPath(); else clearLearningPathUI(); break;
            case 'feedback': if (currentUser) fetchUserFeedback(); else clearUserFeedbackUI(); break;
            case 'teacher-dashboard': if (currentUser?.role === 'teacher') { fetchTeacherSubmissions(); fetchTeacherAnalytics(); /* Optionally fetch students list */ } else { clearTeacherSubmissionsUI(); clearTeacherAnalyticsUI(); clearTeacherStudentsUI(); } break;
            case 'mini-games': renderMiniGameSelection(); break;
        }
    } else { console.error(`Section ${id} not found.`); resetToHomePage(); }
}
function showLearningPage(scrollId = null) { console.log(`Show Learning, scroll: ${scrollId}`); document.querySelectorAll('.section, .hero').forEach(el => el.style.display = 'none'); const page = document.getElementById('learning-page'); if (page) { currentSection = 'learning-page'; page.style.display = 'block'; page.scrollIntoView({ behavior: 'smooth', block: 'start' }); page.querySelectorAll('.learning-section').forEach(s => { if(!s.dataset.animated) animateSectionEntry(s); }); if (scrollId) { setTimeout(() => { const t = document.getElementById(scrollId); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); if(anime) anime({ targets: t, scale: [1, 1.03, 1], duration: 900, easing: 'easeInOutQuad' }); } }, 600); } } else { console.error("#learning-page not found."); resetToHomePage(); } }
function resetToHomePage() { console.log("Reset home."); document.querySelectorAll('.section, #learning-page').forEach(el => el.style.display = 'none'); const hero = document.getElementById('hero-section'); if (hero) { currentSection = 'hero-section'; hero.style.display = 'flex'; if (!hero.dataset.animated) animateSectionEntry(hero.querySelector('.hero-content') || hero); } updateLanguageUI(); }

// --- Animations ---
function setupIntersectionObserver() { const opts = { threshold: 0.1 }; const cb = (entries) => { entries.forEach(e => { if (e.isIntersecting && !e.target.dataset.animated) { animateSectionEntry(e.target); e.target.dataset.animated = 'true'; } }); }; const intersectionObserver = new IntersectionObserver(cb, opts); document.querySelectorAll('.section, .hero-content, .content-card, .ranking-item, .flashcard-wrapper, .feedback-item, .challenge-item, .profile-details, .profile-stats, .mini-game-card, .learning-path-item, .user-feedback-item, .learning-section').forEach(el => { el.style.opacity = '0'; intersectionObserver.observe(el); }); }
function animateSectionEntry(el) { if (!el || !window.anime) return; let cfg = { targets: el, opacity: [0, 1], translateY:[20, 0], duration: 600, easing: 'easeOutQuad' }; if (el.classList.contains('hero-content')) cfg = { ...cfg, translateY: [-50, 0], scale:[0.9, 1], duration: 1200, easing: 'easeOutElastic(1, .7)' }; else if (el.matches('.content-card, .ranking-item, .mini-game-card, .learning-path-item, .challenge-item, .feedback-item, .user-feedback-item')) cfg = { ...cfg, translateY: [50, 0], scale: [0.95, 1], duration: 800, delay: window.anime.stagger(80), easing: 'easeOutExpo' }; else if (el.matches('.profile-details, .profile-stats')) cfg = { ...cfg, translateX: el.classList.contains('profile-details') ? [-40, 0] : [40, 0], duration: 1000, easing: 'easeOutExpo' }; else if (el.matches('.section > h2')) cfg = { ...cfg, translateY: [40, 0], duration: 800, easing: 'easeOutExpo' }; else if (el.classList.contains('learning-section')) cfg = { ...cfg, translateY: [40, 0], duration: 800, delay: window.anime.stagger(150), easing: 'easeOutExpo' }; window.anime(cfg); }
function animateModalOpen(el) { if (!el) return; const c = el.querySelector('.modal-content'); el.style.display = 'flex'; if (c && window.anime) { window.anime({ targets: c, scale: [0.7, 1], opacity: [0, 1], translateY: [-50, 0], duration: 400, easing: 'easeOutCubic' }); } else if (c) { c.style.opacity='1'; c.style.transform='scale(1) translateY(0)'; } }
function animateModalClose(el) { if (!el) return; const c = el.querySelector('.modal-content'); if (c && window.anime) { window.anime({ targets: c, scale: 0.7, opacity: 0, translateY: 50, duration: 300, easing: 'easeInCubic', complete: () => el.style.display = 'none' }); } else { el.style.display = 'none'; } }

// --- Authentication ---
function openAuthModal(isLogin = true) { const m=document.getElementById('auth-modal'); if(!m)return; const f=m.querySelector('#auth-form');const t=m.querySelector('#modal-title');const s=m.querySelector('.auth-submit');const l=m.querySelector('#toggle-link');const ng=m.querySelector('#signup-name-group');const ni=m.querySelector('#signup-name');const ee=m.querySelector('#email-error');const pe=m.querySelector('#password-error');const ne=m.querySelector('#name-error'); f.reset();[ee,pe,ne].forEach(el=>{if(el)el.textContent='';});m.querySelectorAll('.error').forEach(el=>el.classList.remove('error')); const lk='login',sk='signup'; t.dataset.translate=isLogin?lk:sk;s.dataset.translate=isLogin?lk:sk;m.querySelector('#toggle-auth-prompt').dataset.translate=isLogin?'toggle-auth-prompt':'already-have-account';l.dataset.translate=isLogin?sk:lk; ng.style.display=isLogin?'none':'block';ni.required=!isLogin; applyTranslations(m);m.style.display='flex';animateModalOpen(m); }
function closeAuthModal() { animateModalClose(document.getElementById('auth-modal')); }
async function handleAuthSubmit(e) { e.preventDefault(); const m=document.getElementById('auth-modal'); if(!m)return; const isL=m.querySelector('#modal-title')?.dataset.translate==='login'; const nI=m.querySelector('#signup-name'); const eI=m.querySelector('#auth-email'); const pI=m.querySelector('#auth-password'); const nE=m.querySelector('#name-error'); const eE=m.querySelector('#email-error'); const pE=m.querySelector('#password-error'); const name=isL?null:nI?.value.trim(); const email=eI?.value.trim(); const password=pI?.value; [nE,eE,pE].forEach(el=>{if(el)el.textContent='';}); [nI,eI,pI].forEach(el=>el?.classList.remove('error')); let v=true; if(!isL&&!name){if(nE&&nI){nE.textContent=getTranslation('name-required');nI.classList.add('error');v=false;}} if(!email||!/\S+@\S+\.\S+/.test(email)){if(eE&&eI){eE.textContent=getTranslation('invalid-email');eI.classList.add('error');v=false;}} if(!password){if(pE&&pI){pE.textContent=getTranslation('password-required');pI.classList.add('error');v=false;}} if(!isL&&password&&password.length<6){if(pE&&pI){pE.textContent=getTranslation('password-too-short');pI.classList.add('error');v=false;}} if(!v)return; showLoading(); try { const ep=isL?'/api/auth/login':'/api/auth/register'; const pay={email,password}; if(!isL)pay.name=name; const r=await apiFetch(ep,{method:'POST',body:JSON.stringify(pay)}); const d=await r.json(); showNotification(getTranslation(isL?'login-success':'signup-success'),'success'); localStorage.setItem('token',d.token); currentUser=d.user; personalCourseIds=currentUser.personalCourses||[]; updateAuthUI(); closeAuthModal(); await loadInitialData();
        // Dispatch userProfileUpdated event after login
        document.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { user: currentUser } }));
    } catch(err){ console.error(`${isL?'Login':'Signup'} Err:`,err); showNotification(err.message || getTranslation(isL?'login-failed':'signup-failed'),'error'); } finally{hideLoading();} }
async function refreshToken() { console.log("Refreshing token..."); const t=localStorage.getItem('token'); if(!t){logout();return false;} try {const r=await fetch(`${API_URL}/api/auth/refresh`,{method:'POST',headers:{'Authorization':`Bearer ${t}`}}); if(r.ok){localStorage.setItem('token',(await r.json()).token);console.log("Token refreshed.");return true;}else{console.error("Refresh failed:",r.status);logout();return false;}}catch(e){console.error("Refresh fetch err:",e);logout();return false;}}
function logout() { console.log("Logging out..."); const uid=currentUser?._id; localStorage.removeItem('token'); if(uid)localStorage.removeItem(`${CHAT_HISTORY_KEY_PREFIX}${uid}`); currentUser=null; courses={instruments:[],martialArts:[]}; personalCourseIds=[]; rankings=[]; flashcardsData={}; currentDailyChallenge=null; learningPathItems=[]; currentMiniGame=null; userFeedbackList=[]; chatbotHistory=[]; stopRankingUpdatesSSE(); if(isRecognizing)stopSpeechRecognition(); if(synthesis?.speaking)synthesis.cancel(); updateAuthUI(); clearChatbotUI(); clearGrid('instrument-grid','no-courses-available'); clearGrid('martial-grid','no-courses-available'); clearPersonalCoursesUI(); clearLearningPathUI(); clearUserFeedbackUI(); clearTeacherSubmissionsUI(); clearTeacherAnalyticsUI(); clearTeacherStudentsUI(); renderFlashcardUI(); renderRanking([]); renderChallenge(null); displayProfileLoadingOrLogin(); showNotification(getTranslation('logout-success'),'success'); resetToHomePage(); }
function updateAuthUI() { const l=document.getElementById('login-btn');const s=document.getElementById('signup-btn');const a=document.getElementById('user-avatar');const o=document.getElementById('logout-btn');const t=document.querySelector('a[data-section="teacher-dashboard"]');const uL=document.querySelectorAll('li > a[data-section="flashcards"], li > a[data-section="ranking"], li > a[data-section="challenges"], li > a[data-section="mini-games"], li > a[data-section="feedback"], li > a[data-section="profile"]');const cT=document.getElementById('chatbot-toggle');
    // Challenge teacher dashboard button
    const challengeTeacherActions = document.getElementById('challenge-teacher-actions');

    if(currentUser){
        l.style.display='none';
        s.style.display='none';
        o.style.display='inline-block';
        a.style.display='inline-block';
        a.src=getFullAssetUrl(currentUser.avatar)||`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name?.[0]||'?')}&background=random&color=fff`;
        a.alt=`${currentUser.name||'User'}'s Avatar`;
        a.title=currentUser.name||getTranslation('profile');

        // Show/hide teacher dashboard elements based on role
        const isTeacher = currentUser.role === 'teacher';
        if(t?.parentElement) t.parentElement.style.display = isTeacher ? 'list-item' : 'none';

        // Show/hide challenge teacher dashboard button
        if(challengeTeacherActions) challengeTeacherActions.style.display = isTeacher ? 'block' : 'none';

        uL.forEach(link=>link.parentElement.classList.remove('disabled'));
        cT?.classList.remove('disabled');
    } else {
        l.style.display='inline-block';
        s.style.display='inline-block';
        o.style.display='none';
        a.style.display='none';
        a.src="./assets/images/placeholder.png";
        a.alt="Avatar";
        a.title="";

        // Hide teacher elements
        if(t?.parentElement) t.parentElement.style.display='none';
        if(challengeTeacherActions) challengeTeacherActions.style.display='none';

        uL.forEach(link=>link.parentElement.classList.add('disabled'));
        cT?.classList.add('disabled');
    }

  // Dispatch userProfileUpdated event
  document.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { user: currentUser } }));
}

// --- User Profile ---
async function fetchUserProfile() { const token = localStorage.getItem('token'); if (!token) { currentUser = null; updateAuthUI(); displayProfileLoadingOrLogin(); return; } console.log("Fetching profile..."); displayProfileLoadingOrLogin(true); try { const r = await apiFetch('/api/users/me'); currentUser = await r.json(); console.log("Profile OK:", currentUser); personalCourseIds = currentUser.personalCourses || []; updateAuthUI(); updateProfileUI(); loadChatHistory(); } catch (err) { console.error('Fetch profile failed:', err); if (err.message !== getTranslation('session-expired')) showNotification(getTranslation('fetch-profile-error'), 'error'); if (!currentUser) { updateAuthUI(); displayProfileLoadingOrLogin(); } } }
function displayProfileLoadingOrLogin(loading = false) { const v=document.getElementById('profile-view'); const f=document.getElementById('edit-profile-form'); if(!v)return; if(f)f.style.display='none'; v.style.display='flex'; const k=loading?'loading-profile':'please-login'; v.innerHTML = `<p class="${loading?'loading-message':'placeholder'}">${getTranslation(k)}</p>`; }
function updateProfileUI() { const view = document.getElementById('profile-view'); const form = document.getElementById('edit-profile-form'); if (!view) { console.error("Profile view element not found!"); return; } if (!currentUser) { displayProfileLoadingOrLogin(); return; } if (form) form.style.display = 'none'; view.style.display = 'flex'; const achievements = currentUser.achievements || [];
    // Use innerHTML to set the structure, then update dynamic parts
    view.innerHTML = `
        <div class="profile-details" style="width: 100%;">
             <div class="profile-avatar-container" id="profile-avatar-container" title="${getTranslation('change-avatar')}">
                <img id="profile-avatar-img" src="${getFullAssetUrl(currentUser.avatar)}" alt="Avatar" class="profile-avatar">
             </div>
             <h3 id="profile-name">${currentUser.name || 'N/A'}</h3>
             <p><strong data-translate="role">${getTranslation('role')}</strong>: <span id="profile-role-text">${getTranslation(currentUser.role || 'student')}</span></p>
             <p><strong data-translate="email">${getTranslation('email')}</strong>: <a id="profile-email-link" href="mailto:${currentUser.email || ''}">${currentUser.email || 'N/A'}</a></p>
             <div class="profile-actions">
                <button id="edit-profile-btn" class="ripple-btn action-btn edit-profile-btn"><i class="fas fa-user-edit"></i> ${getTranslation('edit-profile')}</button>
                <button id="change-password-btn" class="ripple-btn action-btn change-password-btn"><i class="fas fa-key"></i> ${getTranslation('change-password')}</button>
             </div>
        </div>
        <div class="profile-stats" style="width: 100%;">
             <div class="progress-circle" id="progress-circle" title="${getTranslation('overall-progress')}">
                 <svg viewBox="0 0 120 120">
                     <circle class="progress-bg" cx="60" cy="60" r="54"></circle>
                     <circle id="progress-fill" class="progress-bar animated-circle" cx="60" cy="60" r="54" stroke-dasharray="339.29" stroke-dashoffset="339.29"></circle>
                 </svg>
                 <div class="progress-text" id="progress-text">${currentUser.progress ?? 0}%</div>
             </div>
             <div class="stats-grid">
                 <div class="stat-card">
                     <div class="stat-icon"><i class="fas fa-star"></i></div>
                     <div class="stat-content">
                         <div class="stat-value" id="points-value">${currentUser.points ?? 0}</div>
                         <div class="stat-label" data-translate="points">${getTranslation('points')}</div>
                     </div>
                 </div>
                 <div class="stat-card">
                     <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                     <div class="stat-content">
                         <div class="stat-value" id="level-value">${currentUser.level ?? 1}</div>
                         <div class="stat-label" data-translate="level">${getTranslation('level')}</div>
                     </div>
                 </div>
                 <div class="stat-card">
                     <div class="stat-icon"><i class="fas fa-fire"></i></div>
                     <div class="stat-content">
                         <div class="stat-value" id="streak-value">${currentUser.streak ?? 0}</div>
                         <div class="stat-label" data-translate="streak-text">${getTranslation('streak-text')}</div>
                     </div>
                 </div>
             </div>
             <div class="profile-achievements">
                 <h3 data-translate="achievements">${getTranslation('achievements')}</h3>
                 <div id="achievement-list" class="badge-list">
                     ${renderAchievements(achievements)}
                 </div>
             </div>
        </div>`;
    // Update progress circle SVG specifically
    const progFill = view.querySelector('#progress-fill');
    if (progFill?.r?.baseVal?.value) { const r=progFill.r.baseVal.value; const c=2*Math.PI*r; const prog=currentUser.progress??0; const o=c-(prog/100)*c; progFill.style.strokeDashoffset=o; progFill.style.strokeDasharray=c; }
    applyTranslations(view); // Apply translations to static text within profile-view
}
function renderAchievements(achs){
    if(!achs || achs.length === 0) {
        return `<p class="placeholder">${getTranslation('no-achievements')}</p>`;
    }

    // Define achievement icons based on name
    const getAchievementIcon = (name) => {
        if(name.includes('Tân Binh')) return 'fa-flag';
        if(name.includes('Chăm Chỉ')) return 'fa-book';
        if(name.includes('Thám Hiểm')) return 'fa-compass';
        if(name.includes('Cao Thủ')) return 'fa-crown';
        return 'fa-medal'; // Default icon
    };

    return achs.map(a => {
        const icon = getAchievementIcon(a);
        return `<span class="badge" title="${a}"><i class="fas ${icon}"></i> ${a}</span>`;
    }).join('');
}
function toggleEditProfile(show=true){const f=document.getElementById('edit-profile-form');const v=document.getElementById('profile-view');const i=document.getElementById('edit-name');if(!f||!v)return;if(show){if(currentUser&&i)i.value=currentUser.name||'';v.style.display='none';f.style.display='block';if(i)i.focus();animateModalOpen(f);}else{animateModalClose(f);setTimeout(()=>{if(f.style.display==='none'){v.style.display='flex';updateProfileUI();}},300);}}
function handleProfileViewClick(e) {
    const avatarContainer = e.target.closest('#profile-avatar-container');
    if (avatarContainer || e.target.id === 'profile-avatar-img') {
        openAvatarUploadModal();
    } else if (e.target.closest('#edit-profile-btn') || e.target.id === 'edit-profile-btn') {
        toggleEditProfile(true);
    } else if (e.target.closest('#change-password-btn') || e.target.id === 'change-password-btn') {
        openChangePasswordModal();
    }
}

function openAvatarUploadModal() {
    const modal = document.getElementById('avatar-upload-modal');
    const preview = document.getElementById('avatar-preview');
    const fileName = document.getElementById('avatar-file-name');

    if (!modal || !preview || !fileName) return;

    // Reset form
    document.getElementById('avatar-upload-form')?.reset();
    fileName.textContent = getTranslation('no-file-chosen');

    // Set preview to current avatar
    if (currentUser && currentUser.avatar) {
        preview.src = getFullAssetUrl(currentUser.avatar);
    } else {
        preview.src = './assets/images/placeholder.png';
    }

    animateModalOpen(modal);
}

function closeAvatarUploadModal() {
    animateModalClose(document.getElementById('avatar-upload-modal'));
}

function handleAvatarFileSelect(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('avatar-preview');
    const fileName = document.getElementById('avatar-file-name');

    if (!file || !preview || !fileName) return;

    // Validate file type
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_AVATAR_EXTENSIONS.includes(fileExt)) {
        showNotification(getTranslation('invalid-avatar-type'), 'error');
        e.target.value = '';
        fileName.textContent = getTranslation('no-file-chosen');
        return;
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
        showNotification(getTranslation('avatar-too-large'), 'error');
        e.target.value = '';
        fileName.textContent = getTranslation('no-file-chosen');
        return;
    }

    // Update file name display
    fileName.textContent = file.name;

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function handleAvatarUpload(e) {
    e.preventDefault();

    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        return;
    }

    let formData;
    let file;

    // Check if formData was passed directly (from direct upload)
    if (e.formData) {
        formData = e.formData;
        file = formData.get('avatar');
    } else {
        // Get file from form input
        const fileInput = document.getElementById('avatar-file');
        file = fileInput?.files[0];

        if (!file) {
            showNotification(getTranslation('select-avatar-file'), 'error');
            return;
        }

        // Create FormData
        formData = new FormData();
        formData.append('avatar', file);
    }

    // Validate file type
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_AVATAR_EXTENSIONS.includes(fileExt)) {
        showNotification(getTranslation('invalid-avatar-type'), 'error');
        return;
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
        showNotification(getTranslation('avatar-too-large'), 'error');
        return;
    }

    showLoading();

    try {
        const response = await apiFetch(AVATAR_UPLOAD_ENDPOINT, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // Update current user data
        if (data.avatarUrl) {
            currentUser.avatar = data.avatarUrl;

            // Update avatar in UI
            const profileAvatar = document.getElementById('profile-avatar-img');
            const headerAvatar = document.querySelector('.user-avatar');

            if (profileAvatar) profileAvatar.src = getFullAssetUrl(data.avatarUrl);
            if (headerAvatar) headerAvatar.src = getFullAssetUrl(data.avatarUrl);
        }

        showNotification(getTranslation('avatar-changed'), 'success');
        closeAvatarUploadModal();

    } catch (error) {
        console.error('Avatar upload error:', error);
        showNotification(error.message || getTranslation('avatar-upload-error'), 'error');
    } finally {
        hideLoading();
    }
}
async function handleProfileEditSubmit(e){e.preventDefault();const i=document.getElementById('edit-name');const n=i?.value.trim();if(!n){showNotification(getTranslation('enter-new-name'),'error');return;}if(n===currentUser?.name){showNotification(getTranslation('name-not-changed'),'info');toggleEditProfile(false);return;}showLoading();try{const r=await apiFetch(`/api/users/${currentUser._id}`,{method:'PUT',body:JSON.stringify({name:n})});currentUser=await r.json();updateProfileUI();updateAuthUI();showNotification(getTranslation('name-changed'),'success');toggleEditProfile(false);}catch(err){console.error("Profile edit err:",err);if(err.message!==getTranslation('session-expired'))showNotification(err.message||getTranslation('update-profile-error'),'error');}finally{hideLoading();}}
function openChangePasswordModal(){const m=document.getElementById('change-password-modal');if(m){m.querySelector('form')?.reset();m.querySelectorAll('input').forEach(i=>i.classList.remove('error'));animateModalOpen(m);}}
function closeChangePasswordModal(){animateModalClose(document.getElementById('change-password-modal'));}
async function handleChangePasswordSubmit(e){e.preventDefault();const m=document.getElementById('change-password-modal');const cur=m?.querySelector('#current-password');const nw=m?.querySelector('#new-password');const cnf=m?.querySelector('#confirm-password');if(!cur||!nw||!cnf)return;const curP=cur.value,newP=nw.value,cnfP=cnf.value;[cur,nw,cnf].forEach(i=>i.classList.remove('error'));let v=true,k=null;if(!curP){cur.classList.add('error');v=false;}if(!newP||newP.length<6){nw.classList.add('error');k='password-too-short';v=false;}else if(newP!==cnfP){cnf.classList.add('error');k='passwords-mismatch';v=false;}else if(curP===newP&&curP){nw.classList.add('error');k='passwords-same';v=false;}if(!v){showNotification(getTranslation(k||'check-password-fields'),'error');return;}showLoading();try{const r=await apiFetch('/api/users/change-password',{method:'POST',body:JSON.stringify({currentPassword:curP,newPassword:newP})});const d=await r.json();if(!r.ok){if(r.status===401&&d.message?.toLowerCase().includes('incorrect')){showNotification(getTranslation('current-password-incorrect'),'error');cur.classList.add('error');}else throw new Error(d.message||`HTTP ${r.status}`);}else{showNotification(getTranslation('password-changed'),'success');closeChangePasswordModal();}}catch(err){console.error("Change pw err:",err);if(err.message!==getTranslation('session-expired')&&!err.message.includes('incorrect'))showNotification(err.message||getTranslation('server-error'),'error');}finally{hideLoading();}}
async function handleAvatarChange(e){const i=e.target;const f=i.files[0];if(!f)return;const x=f.name.split('.').pop().toLowerCase();if(!ALLOWED_AVATAR_EXTENSIONS.includes(x)){showNotification(getTranslation('invalid-avatar-type'),'error');i.value=null;return;}if(f.size>MAX_AVATAR_SIZE_MB*1024*1024){showNotification(getTranslation('avatar-too-large'),'error');i.value=null;return;}showLoading();try{const fd=new FormData();fd.append('avatar',f);const r=await apiFetch('/api/users/change-avatar',{method:'POST',body:fd});const d=await r.json();if(d.user)currentUser=d.user;else if(d.avatarUrl)currentUser.avatar=d.avatarUrl;updateProfileUI();updateAuthUI();showNotification(getTranslation('avatar-changed'),'success');}catch(err){console.error("Avatar upload err:",err);if(err.message!==getTranslation('session-expired'))showNotification(err.message||getTranslation('avatar-upload-error'),'error');}finally{hideLoading();i.value=null;}}

// --- Courses & Learning ---
async function fetchCourses() {
    console.log("Fetching courses from API...");
    const ig = document.getElementById('instrument-grid');
    const mg = document.getElementById('martial-grid');

    if(ig) ig.innerHTML = `<p class="loading-message">${getTranslation('loading-courses')}</p>`;
    if(mg) mg.innerHTML = `<p class="loading-message">${getTranslation('loading-courses')}</p>`;

    try {
        const r = await apiFetch('/api/courses');
        const all = await r.json();

        console.log("Courses data received:", all);

        // Filter courses by category
        courses.instruments = all.filter(c => c.category === 'Nhạc cụ dân tộc');
        courses.martialArts = all.filter(c => c.category === 'Vovinam');

        // Render the grids
        renderGrid('instrument-grid', courses.instruments, 'no-courses-available');
        renderGrid('martial-grid', courses.martialArts, 'no-courses-available');

        // Update personal courses if user is logged in
        if(currentUser) {
            await fetchPersonalCoursesData();
        } else {
            clearPersonalCoursesUI();
        }
    } catch(err) {
        console.error("Fetch courses error:", err);
        showNotification(getTranslation('fetch-courses-error'), 'error');
        clearGrid('instrument-grid', 'fetch-courses-error');
        clearGrid('martial-grid', 'fetch-courses-error');
    }
}
async function fetchPersonalCoursesData(){if(!currentUser||!personalCourseIds||personalCourseIds.length===0){clearPersonalCoursesUI();return;}const all=[...courses.instruments,...courses.martialArts];const detailed=personalCourseIds.map(id=>all.find(c=>c._id===id)).filter(Boolean);renderGrid('personal-courses-grid',detailed,'no-personal-courses',true);}
function renderGrid(id, items, pKey='no-items', removeBtn=false){const g=document.getElementById(id);if(!g)return;g.innerHTML='';if(!items||items.length===0){g.innerHTML=`<p class="placeholder ${pKey.includes('error')?'error':''}">${getTranslation(pKey)}</p>`;return;}items.forEach(item=>{const card=createCourseCard(item,removeBtn);if(card){g.appendChild(card);if(anime&&!card.dataset.animated){anime({targets:card,opacity:[0,1],translateY:[20,0],duration:500,easing:'easeOutQuad'});card.dataset.animated=true;}}});}
function createCourseCard(item, removeBtn){
    const c = document.createElement('div');
    c.className = 'content-card';
    c.dataset.id = item._id;

    const drag = !removeBtn;
    if(drag) {
        c.classList.add('draggable');
        c.draggable = true;
    }

    const thumb = getFullAssetUrl(item.thumbnail);
    const title = item.title || 'N/A';
    const desc = item.description || '';

    // Get avatar for the course directly
    let avatarUrl = null;
    if (title) {
        console.log('Looking for avatar for title:', title);

        // Direct matching based on title with absolute paths
        if (title.includes('Sáo Trúc Cơ Bản')) {
            avatarUrl = '/assets/images/avatars/sao.jpg';
        } else if (title.includes('Kỹ Thuật Láy Sáo')) {
            avatarUrl = '/assets/images/avatars/sao.jpg';
        } else if (title.includes('Đàn Tranh')) {
            avatarUrl = '/assets/images/avatars/dan_tranh.jpg';
        } else if (title.includes('Đàn Nguyệt')) {
            avatarUrl = '/assets/images/avatars/dan_nguyet.jpg';
        } else if (title.includes('Vovinam')) {
            avatarUrl = '/assets/images/avatars/vovinam.jpg';
        }

        console.log('Avatar URL found:', avatarUrl);
    }

    console.log('Creating card for course:', title, 'with avatar:', avatarUrl);

    // Create the basic card structure with learn button only and avatar as background
    c.innerHTML = `
        ${avatarUrl ? `<div class="course-avatar-bg" style="background-image: url('${avatarUrl}')"></div>` : `<div class="thumbnail" style="background-image: url('${thumb}')" loading="lazy"></div>`}
        <div class="card-content">
            <h3>${title}</h3>
            <p>${desc.substring(0,100)}${desc.length>100?'...':''}</p>
            <div class="buttons">
                <button class="action-btn learn-btn ripple-btn" data-id="${item._id}" data-theory-url="${item.theory_url || '#'}"><i class="fas fa-graduation-cap"></i> ${getTranslation('learn')}</button>
                ${removeBtn ?
                    `<button class="action-btn remove-btn ripple-btn" data-id="${item._id}"><i class="fas fa-times"></i> ${getTranslation('remove')}</button>` :
                    `<button class="action-btn add-btn ripple-btn" data-id="${item._id}"><i class="fas fa-plus"></i> ${getTranslation('add-favorite')}</button>`
                }
            </div>
        </div>
    `;

    // We now use a global event listener for all course action buttons
    // No need to add individual event listeners here

    return c;
}
function clearGrid(id,pKey){const g=document.getElementById(id);if(g){g.innerHTML=`<p class="placeholder ${pKey.includes('error')?'error':''}">${getTranslation(pKey)}</p>`;}}
function clearPersonalCoursesUI(){clearGrid('personal-courses-grid','no-personal-courses');}
function handleCourseActionClick(e){
    const btn=e.target.closest('.action-btn[data-id]');
    if(!btn) return;

    const id=btn.dataset.id;
    console.log('Course action clicked:', btn.className, 'ID:', id);

    if(btn.classList.contains('video-btn')) {
        console.log('Handling video action');
        handleVideoAction(id, btn.dataset.url);
    } else if(btn.classList.contains('theory-btn')) {
        console.log('Handling theory action');
        handleTheoryAction(id, btn.dataset.url);
    } else if(btn.classList.contains('add-btn')) {
        console.log('Adding to favorites');
        addToFavorites(id);
    } else if(btn.classList.contains('remove-btn')) {
        console.log('Removing from favorites');
        removeFromFavorites(id);
    } else if(btn.classList.contains('learn-btn')) {
        console.log('Handling learn action');
        handleLearnAction(id);
    }
}
async function handleVideoAction(id, videoUrl) {
    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        openAuthModal(true);
        return;
    }

    console.log(`Video action for course: ${id}, URL: ${videoUrl}`);

    try {
        // Fetch the course details
        const response = await apiFetch(`/api/courses/${id}`);
        const course = await response.json();

        if (!course) {
            showNotification(getTranslation('course-not-found'), 'error');
            return;
        }

        // Show the course page section
        document.querySelectorAll('.section, .hero, #learning-page').forEach(el => el.style.display = 'none');
        const coursePageSection = document.getElementById('course-videos');

        if (coursePageSection) {
            // Update course title
            const courseTitle = document.getElementById('course-videos-title');
            if (courseTitle) courseTitle.textContent = course.title || 'Course Videos';

            // Update course description
            const courseDesc = document.getElementById('course-videos-description');
            if (courseDesc) courseDesc.innerHTML = `<p>${course.description || ''}</p>`;

            // Set up video content
            const videosGrid = document.getElementById('course-videos-grid');
            if (videosGrid) {
                videosGrid.innerHTML = `
                    <div class="video-container">
                        <div id="video-placeholder" class="video-placeholder">
                            <i class="fas fa-play-circle"></i>
                            <span>Click to play video</span>
                        </div>
                        <iframe id="video-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display: none;"></iframe>
                    </div>
                `;

                // Set up video URL in the video placeholder
                const videoPlaceholder = document.getElementById('video-placeholder');
                const videoIframe = document.getElementById('video-iframe');

                if (videoPlaceholder && videoIframe) {
                    // Add event listener to play the video
                    videoPlaceholder.addEventListener('click', function() {
                        const videoUrl = course.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
                        videoIframe.src = videoUrl;
                        videoIframe.style.display = 'block';
                        videoPlaceholder.style.display = 'none';

                        // Points are no longer awarded for watching videos
                    });
                }
            }

            // Add event listener to the back button
            const backButton = document.getElementById('back-to-courses');
            if (backButton) {
                // Remove any existing event listeners
                const newBackButton = backButton.cloneNode(true);
                backButton.parentNode.replaceChild(newBackButton, backButton);

                newBackButton.addEventListener('click', function() {
                    coursePageSection.style.display = 'none';
                    showLearningPage();
                });
            }

            // Display the section
            coursePageSection.style.display = 'block';
            coursePageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Fallback to opening in a new tab if section doesn't exist
            if (course.video_url) {
                window.open(course.video_url, '_blank');
            } else {
                showNotification('Video không khả dụng', 'warning');
            }
        }

        // Points are no longer awarded for starting a course

    } catch (err) {
        console.error('Error fetching course:', err);
        showNotification(getTranslation('error-fetching-course'), 'error');
    }
}

async function handleTheoryAction(id, theoryUrl) {
    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        openAuthModal(true);
        return;
    }

    console.log(`Theory action for course: ${id}, URL: ${theoryUrl}`);

    try {
        // Fetch the course details
        const response = await apiFetch(`/api/courses/${id}`);
        const course = await response.json();

        if (!course) {
            showNotification(getTranslation('course-not-found'), 'error');
            return;
        }

        // Show the course page section
        document.querySelectorAll('.section, .hero, #learning-page').forEach(el => el.style.display = 'none');
        const coursePageSection = document.getElementById('course-videos');

        if (coursePageSection) {
            // Update course title
            const courseTitle = document.getElementById('course-videos-title');
            if (courseTitle) courseTitle.textContent = `${course.title || 'Course'} - Lý thuyết`;

            // Update course description
            const courseDesc = document.getElementById('course-videos-description');
            if (courseDesc) courseDesc.innerHTML = `<p>${course.description || ''}</p>`;

            // Set up theory content
            const videosGrid = document.getElementById('course-videos-grid');
            if (videosGrid) {
                videosGrid.innerHTML = `
                    <div class="theory-container">
                        <div class="theory-controls">
                            <button class="theory-size-btn" data-action="decrease" title="${getTranslation('decrease-size')}"><i class="fas fa-search-minus"></i></button>
                            <button class="theory-size-btn" data-action="reset" title="${getTranslation('reset-size')}"><i class="fas fa-redo"></i></button>
                            <button class="theory-size-btn" data-action="increase" title="${getTranslation('increase-size')}"><i class="fas fa-search-plus"></i></button>
                        </div>
                        <iframe src="${course.theory_url || theoryUrl}" frameborder="0" id="theory-single-iframe" style="width: 100%; height: 600px;"></iframe>
                    </div>
                `;
            }

            // Add event listener to the back button
            const backButton = document.getElementById('back-to-courses');
            if (backButton) {
                // Remove any existing event listeners
                const newBackButton = backButton.cloneNode(true);
                backButton.parentNode.replaceChild(newBackButton, backButton);

                newBackButton.addEventListener('click', function() {
                    coursePageSection.style.display = 'none';
                    showLearningPage();
                });
            }

            // Display the section
            coursePageSection.style.display = 'block';
            coursePageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Fallback to opening in a new tab if section doesn't exist
            if (course.theory_url) {
                window.open(course.theory_url, '_blank');
            } else {
                showNotification('Lý thuyết không khả dụng', 'warning');
            }
        }

        // Points are no longer awarded for studying theory

    } catch (err) {
        console.error('Error fetching course:', err);
        showNotification(getTranslation('error-fetching-course'), 'error');
    }
}

async function handleLearnAction(id) {
    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        openAuthModal(true);
        return;
    }

    console.log(`Learn course: ${id}`);

    try {
        // Fetch the course details
        const response = await apiFetch(`/api/courses/${id}`);
        const course = await response.json();

        if (!course) {
            showNotification(getTranslation('course-not-found'), 'error');
            return;
        }

        // Show the course page section
        document.querySelectorAll('.section, .hero, #learning-page').forEach(el => el.style.display = 'none');
        const coursePageSection = document.getElementById('course-videos');

        if (coursePageSection) {
            // Update course title
            const courseTitle = document.getElementById('course-videos-title');
            if (courseTitle) courseTitle.textContent = course.title || 'Sáo Trúc Cơ Bản';

            // Update course description
            const courseDesc = document.getElementById('course-videos-description');
            if (courseDesc) courseDesc.innerHTML = `<p>Khóa học nhập môn với cách cầm sáo, thổi hơi và các nốt cơ bản</p>`;

            // Set up content with separate tabs for video and theory
            const videosGrid = document.getElementById('course-videos-grid');
            if (videosGrid) {
                videosGrid.innerHTML = `
                    <div class="course-content-tabs">
                        <button id="video-tab" class="content-tab active">Video</button>
                        <button id="theory-tab" class="content-tab">Lý thuyết</button>
                    </div>
                    <div id="video-content" class="tab-content active">
                        <div class="video-container">
                            <div id="video-placeholder" class="video-placeholder">
                                <i class="fas fa-play-circle"></i>
                                <span>Nhấn để xem video bài học</span>
                            </div>
                            <iframe id="video-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display: none; width: 100%; height: 100%;"></iframe>
                        </div>
                    </div>
                    <div id="theory-content" class="tab-content" style="display: none;">
                        <div class="theory-container">
                            <div class="theory-controls">
                                <button class="theory-size-btn" data-action="decrease" title="${getTranslation('decrease-size')}"><i class="fas fa-search-minus"></i></button>
                                <button class="theory-size-btn" data-action="reset" title="${getTranslation('reset-size')}"><i class="fas fa-redo"></i></button>
                                <button class="theory-size-btn" data-action="increase" title="${getTranslation('increase-size')}"><i class="fas fa-search-plus"></i></button>
                            </div>
                            <iframe id="theory-iframe" src="" frameborder="0" style="width: 100%; height: 900px; border-radius: 8px;"></iframe>
                        </div>
                    </div>
                `;

                // Set up video URL in the video placeholder
                const videoPlaceholder = document.getElementById('video-placeholder');
                const videoIframe = document.getElementById('video-iframe');
                const theoryIframe = document.getElementById('theory-iframe');

                // Determine the appropriate theory URL based on course title
                let theory_url = '';
                const courseTitle = course.title ? course.title.toLowerCase() : '';

                if (courseTitle.includes('sáo') || courseTitle.includes('sao')) {
                    theory_url = 'https://docs.google.com/document/d/1QOSk82iV3gMGAmJXd3vYc78pEgu0vC-ghm_fCY83XDA/preview?rm=minimal&widget=false&chrome=false&size=A4&zoom=1.5';
                } else if (courseTitle.includes('đàn nguyệt') || courseTitle.includes('dan nguyet')) {
                    theory_url = 'https://docs.google.com/document/d/e/2PACX-1vQquDxG5JbXQgECTvO4XSCvY6JEVCFmCz5uT4R7Z_Uf9bGhfQIZwZ1MnN-YZOQZHx5Qg_7uWYJwQqRU/pub?embedded=true&rm=minimal&widget=false&chrome=false&size=A4&zoom=1.5';
                } else if (courseTitle.includes('đàn tranh') || courseTitle.includes('dan tranh')) {
                    theory_url = 'https://docs.google.com/document/d/1W6IkS7mXwusxT9YVDnVmS5BgPptAGPDpqaQirUXWK3g/preview?rm=minimal&widget=false&chrome=false&size=A4&zoom=1.5';
                } else if (courseTitle.includes('vovinam')) {
                    theory_url = 'https://docs.google.com/document/d/1FAGHDPYsAlvV2pcg77kYY3yFsglInz_adRnTDYqoZ6A/preview?rm=minimal&widget=false&chrome=false&size=A4&zoom=1.5';
                } else {
                    theory_url = 'https://docs.google.com/document/d/1QOSk82iV3gMGAmJXd3vYc78pEgu0vC-ghm_fCY83XDA/preview?rm=minimal&widget=false&chrome=false&size=A4&zoom=1.5';
                }

                // Set the theory iframe source only when the theory tab is active
                if (theoryIframe) {
                    console.log(`Loading theory for course: ${courseTitle}, URL: ${theory_url}`);
                    theoryIframe.src = theory_url;
                }

                if (videoPlaceholder && videoIframe) {
                    // Add event listener to play the video
                    videoPlaceholder.addEventListener('click', function() {
                        // Get video URL based on course ID or title
                        let videoUrl = '';
                        let theory_url ='';
                        // Check course title or ID to determine which video to show
                        const courseTitle = course.title ? course.title.toLowerCase() : '';

                        if (courseTitle.includes('sáo') || courseTitle.includes('sao')) {
                            // Sáo video
                            videoUrl = 'https://www.youtube.com/embed/QOMzCJeGSrg?autoplay=1&rel=0&showinfo=0&modestbranding=1';
                            theory_url='https://docs.google.com/document/d/1QOSk82iV3gMGAmJXd3vYc78pEgu0vC-ghm_fCY83XDA/preview?rm=minimal&widget=false&chrome=false'
                        } else if (courseTitle.includes('đàn nguyệt') || courseTitle.includes('dan nguyet')) {
                            // Đàn nguyệt video
                            videoUrl = 'https://www.youtube.com/embed/NbXoE6kvKTI?autoplay=1&rel=0&showinfo=0&modestbranding=1';
                            theory_url='https://docs.google.com/document/d/e/2PACX-1vQquDxG5JbXQgECTvO4XSCvY6JEVCFmCz5uT4R7Z_Uf9bGhfQIZwZ1MnN-YZOQZHx5Qg_7uWYJwQqRU/pub?embedded=true&rm=minimal&widget=false&chrome=false';

                        } else if (courseTitle.includes('đàn tranh') || courseTitle.includes('dan tranh')) {
                            // Đàn tranh video
                            videoUrl = 'https://www.youtube.com/embed/AIoBdPq7npg?autoplay=1&rel=0&showinfo=0&modestbranding=1';
                            theory_url='https://docs.google.com/document/d/1W6IkS7mXwusxT9YVDnVmS5BgPptAGPDpqaQirUXWK3g/preview?rm=minimal&widget=false&chrome=false'
                        } else if (courseTitle.includes('vovinam')) {
                            // Vovinam video
                            videoUrl = 'https://www.youtube.com/embed/pCAFUTcwgjQ?autoplay=1&rel=0&showinfo=0&modestbranding=1';
                            theory_url='https://docs.google.com/document/d/1FAGHDPYsAlvV2pcg77kYY3yFsglInz_adRnTDYqoZ6A/preview?rm=minimal&widget=false&chrome=false'
                        } else {
                            // Default video if no match
                            videoUrl = 'https://www.youtube.com/embed/QOMzCJeGSrg?autoplay=1&rel=0&showinfo=0&modestbranding=1';
                            theory_url='https://docs.google.com/document/d/1QOSk82iV3gMGAmJXd3vYc78pEgu0vC-ghm_fCY83XDA/preview?rm=minimal&widget=false&chrome=false';
                        }

                        console.log(`Playing video for course: ${courseTitle}, URL: ${videoUrl}`);
                        videoIframe.src = videoUrl;
                        videoIframe.style.display = 'block';
                        videoPlaceholder.style.display = 'none';

                        // Set the theory iframe source only if needed
                        const theoryIframe = document.getElementById('theory-iframe');
                        if (theoryIframe && theory_url && !theoryIframe.src) {
                            console.log(`Loading theory for course: ${courseTitle}, URL: ${theory_url}`);
                            theoryIframe.src = theory_url;
                        }
                    });
                }

                // Add tab switching functionality
                const videoTab = document.getElementById('video-tab');
                const theoryTab = document.getElementById('theory-tab');
                const videoContent = document.getElementById('video-content');
                const theoryContent = document.getElementById('theory-content');

                if (videoTab && theoryTab && videoContent && theoryContent) {
                    videoTab.addEventListener('click', function() {
                        videoTab.classList.add('active');
                        theoryTab.classList.remove('active');
                        videoContent.classList.add('active');
                        videoContent.style.display = 'block';
                        theoryContent.classList.remove('active');
                        theoryContent.style.display = 'none';
                    });

                    theoryTab.addEventListener('click', function() {
                        theoryTab.classList.add('active');
                        videoTab.classList.remove('active');
                        theoryContent.classList.add('active');
                        theoryContent.style.display = 'block';
                        videoContent.classList.remove('active');
                        videoContent.style.display = 'none';
                    });
                }
            }

            // Add event listener to the back button
            const backButton = document.getElementById('back-to-courses');
            if (backButton) {
                // Remove any existing event listeners
                const newBackButton = backButton.cloneNode(true);
                backButton.parentNode.replaceChild(newBackButton, backButton);

                // Update the button text and icon
                newBackButton.innerHTML = '<i class="fas fa-arrow-left"></i> Quay lại';

                newBackButton.addEventListener('click', function() {
                    coursePageSection.style.display = 'none';
                    showLearningPage();
                });
            }

            // Display the section
            coursePageSection.style.display = 'block';
            coursePageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Fallback to opening in a new tab if section doesn't exist
            if (course.video_url) {
                window.open(course.video_url, '_blank');
            } else {
                showNotification('Nội dung không khả dụng', 'warning');
            }
        }

    } catch (err) {
        console.error('Error fetching course:', err);
        showNotification(getTranslation('error-fetching-course'), 'error');
    }
}


async function addToFavorites(id){if(!currentUser){showNotification(getTranslation('please-login'),'error');openAuthModal(true);return;}if(personalCourseIds.includes(id)){showNotification(getTranslation('already-in-favorites'),'warning');return;}showLoading();try{const r=await apiFetch('/api/users/personal-courses',{method:'POST',body:JSON.stringify({courseId:id})});currentUser=(await r.json()).user;personalCourseIds=currentUser.personalCourses||[];await fetchPersonalCoursesData();showNotification(getTranslation('added-to-favorites'),'success');}catch(err){console.error("Add fav err:",err);if(err.message!==getTranslation('session-expired'))showNotification(err.message||getTranslation('add-favorite-error'),'error');}finally{hideLoading();}}
async function removeFromFavorites(id){if(!currentUser)return;showLoading();try{const r=await apiFetch(`/api/users/personal-courses/${id}`,{method:'DELETE'});currentUser=(await r.json()).user;personalCourseIds=currentUser.personalCourses||[];await fetchPersonalCoursesData();showNotification(getTranslation('removed-from-favorites'),'success');}catch(err){console.error("Remove fav err:",err);if(err.message!==getTranslation('session-expired'))showNotification(err.message||getTranslation('remove-favorite-error'),'error');}finally{hideLoading();}}
function handleDragStart(e){const c=e.target.closest('.content-card.draggable');if(c)e.dataTransfer.setData('text/plain',c.dataset.id);}
function handleDragOver(e){e.preventDefault();e.dataTransfer.dropEffect='move';e.currentTarget.classList.add('drag-over');}
function handleDragLeave(e){e.currentTarget.classList.remove('drag-over');}
function handleDropOnPersonalCourses(e){e.preventDefault();e.currentTarget.classList.remove('drag-over');const id=e.dataTransfer.getData('text/plain');if(id)addToFavorites(id);}

// --- Search ---
function handleSearch(e){const q=e.target.value.toLowerCase().trim();filterGridContent('#instrument-grid',q);filterGridContent('#martial-grid',q);}
function filterGridContent(sel,query){const g=document.querySelector(sel);if(!g)return;let vis=false;g.querySelectorAll('.content-card').forEach(c=>{const t=c.querySelector('h3')?.textContent.toLowerCase()||'';const d=c.querySelector('p')?.textContent.toLowerCase()||'';const show=query===''||t.includes(query)||d.includes(query);c.style.display=show?'block':'none';if(show)vis=true;});const p=g.querySelector('.placeholder');if(p)p.style.display=vis?'none':'block';const nr=getTranslation('no-search-results');const nc=getTranslation(sel.includes('personal')?'no-personal-courses':'no-courses-available');if(!vis&&query!==''&&p&&p.textContent!==nr)p.textContent=nr;else if(p&&query===''&&p.textContent!==nc)p.textContent=nc;}

// --- Gamification ---
function calculateLevel(pts){return Math.floor(pts/100)+1;}
function checkAchievements(newPts){const earned=[];if(!currentUser)return earned;const existing=currentUser.achievements||[];const thresholds=[{points:50,name:'Tân Binh'},{points:200,name:'Học Viên Chăm Chỉ'},{points:500,name:'Nhà Thám Hiểm Văn Hóa'},{points:1000,name:'Cao Thủ'}];thresholds.forEach(a=>{if(newPts>=a.points&&!existing.includes(a.name))earned.push(a.name);});return earned;}
async function updateUserProgressAndPoints(ptsToAdd,progToAdd,reason="Activity"){if(!currentUser||(ptsToAdd<=0&&progToAdd<=0))return;console.log(`Update: +${ptsToAdd}pts, +${progToAdd}% for ${reason}`);const curPts=currentUser.points??0;const curProg=currentUser.progress??0;const curLvl=currentUser.level??1;const newPts=curPts+ptsToAdd;const newProg=Math.min(100,curProg+progToAdd);const newLvl=calculateLevel(newPts);const lvlChanged=newLvl>curLvl;const newAchs=checkAchievements(newPts);const updates={};if(newPts!==curPts)updates.points=newPts;if(newProg!==curProg)updates.progress=newProg;if(lvlChanged)updates.level=newLvl;if(newAchs.length>0)updates.achievements=[...(currentUser.achievements||[]),...newAchs];if(Object.keys(updates).length===0)return;showLoading();try{const r=await apiFetch(`/api/users/${currentUser._id}`,{method:'PUT',body:JSON.stringify(updates)});currentUser=await r.json();updateProfileUI();if(ptsToAdd>0)showNotification(`${getTranslation('points-earned')}:+${ptsToAdd} (${reason})`,'success');if(lvlChanged)showNotification(`${getTranslation('level-up')} ${currentUser.level}!`,'success');newAchs.forEach(a=>showNotification(`${getTranslation('achievement-unlocked')}:${a}`,'success'));}catch(err){console.error("Update points error:",err);if(err.message!==getTranslation('session-expired'))showNotification(err.message||getTranslation('update-profile-error'),'error');}finally{hideLoading();}}

// --- Ranking ---
async function fetchInitialRankings() { if (!currentUser) { renderRanking([]); return; } console.log("Fetching initial rankings..."); const listEl = document.getElementById('ranking-list'); if (listEl) listEl.innerHTML = `<p class="loading-message">${getTranslation('loading-ranking')}</p>`; try { const response = await apiFetch('/api/rankings'); rankings = await response.json(); renderRanking(rankings); } catch (err) { console.error("Fetch initial rankings err:", err); showNotification(getTranslation('fetch-rankings-error'), 'error'); renderRanking([]); } }
function startRankingUpdatesSSE() {
    if (!currentUser) { updateSSEStatus('disconnected', getTranslation('please-login-ranking')); return; }
    if (eventSourceRankings && eventSourceRankings.readyState !== EventSource.CLOSED) return; // Already running
    console.log("SSE: Initializing..."); updateSSEStatus('connecting', getTranslation('connecting'));
    const token = localStorage.getItem('token'); if (!token) { updateSSEStatus('error', getTranslation('token-missing')); logout(); return; }
    try {
        eventSourceRankings = new EventSource(`${RANKING_SSE_URL}?token=${encodeURIComponent(token)}`);
        eventSourceRankings.onopen = () => { console.log("SSE: Connected."); updateSSEStatus('connected', getTranslation('ranking-stream-connected')); };
        // NOTE: This listener waits for 'update' events.
        // Your CURRENT backend `/api/rankings/stream` only sends 'connected'.
        // You MUST modify the backend to periodically send 'update' events with new ranking data for this to work.
        eventSourceRankings.addEventListener('update', (e) => {
            console.log("SSE: Received 'update' event from backend.");
            try {
                rankings = JSON.parse(e.data);
                if (document.getElementById('ranking')?.style.display !== 'none') renderRanking(rankings);
            } catch (err) { console.error("SSE Parse err:", err); }
        });
        eventSourceRankings.onerror = (err) => { console.error("SSE Error:", err); updateSSEStatus('error', getTranslation('ranking-stream-error')); stopRankingUpdatesSSE(); /* Consider reconnect */ };
    } catch (e) { console.error("SSE Create failed:", e); updateSSEStatus('error', getTranslation('ranking-stream-error')); }
}
function stopRankingUpdatesSSE() { if (eventSourceRankings) { eventSourceRankings.close(); eventSourceRankings = null; console.log("SSE: Closed."); updateSSEStatus('disconnected', getTranslation('ranking-stream-disconnected')); } }
function updateSSEStatus(statusType, message) { /* Status indicator removed */ console.log(`SSE Status: ${statusType} - ${message}`); }
function renderRanking(data = rankings) {
    const list = document.getElementById('ranking-list');
    const ctrls = document.querySelector('#ranking .ranking-controls');
    if (!list || !ctrls) return;

    list.innerHTML = '';

    if (!currentUser) {
        list.innerHTML = `<p class="placeholder">${getTranslation('please-login-ranking')}</p>`;
        ctrls.style.display = 'none';
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = `<p class="placeholder">${getTranslation('no-rankings-yet')}</p>`;
        ctrls.style.display = 'none';
        return;
    }

    // Find current user's position
    const currentUserIndex = data.findIndex(r => r.userId === currentUser._id);

    // Create ranking items
    data.forEach((item, index) => {
        const isCurrentUser = item.userId === currentUser._id;
        const topClass = index < 3 ? `top-${index + 1}` : '';

        const rankItem = document.createElement('div');
        rankItem.className = `ranking-item ${topClass} ${isCurrentUser ? 'current-user' : ''}`;
        rankItem.dataset.userId = item.userId || '';

        rankItem.innerHTML = `
            <div class="rank">${index + 1}</div>
            <img src="${getFullAssetUrl(item.avatar)}" alt="${item.name || '?'}" class="rank-avatar"
                onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.name?.[0] || '?')}&background=random&color=fff'">
            <div class="rank-info">
                <div class="rank-name">${item.name || 'Anon'} ${isCurrentUser ? `<span class="you-badge">(${getTranslation('you')})</span>` : ''}</div>
                <div class="rank-stats">
                    <div class="rank-points"><i class="fas fa-star"></i> ${getTranslation('points')}: ${item.points || 0}</div>
                    <div class="rank-level"><i class="fas fa-trophy"></i> ${getTranslation('level')}: ${item.level || 1}</div>
                </div>
            </div>
            <div class="points"><i class="fas fa-medal"></i> ${item.points || 0}</div>
        `;

        list.appendChild(rankItem);
    });

    // Show scroll controls if needed
    if (data.length > 5) {
        ctrls.style.display = 'flex';
        updateRankingScrollButtons();
    } else {
        ctrls.style.display = 'none';
    }

    // Apply animations
    if (anime) {
        anime({
            targets: list.querySelectorAll('.ranking-item'),
            opacity: [0, 1],
            translateY: [20, 0],
            scale: [0.95, 1],
            duration: 800,
            delay: anime.stagger(80),
            easing: 'easeOutExpo'
        });
    }

    // Scroll to current user if not in view
    if (currentUserIndex > 4) {
        setTimeout(() => {
            const userItem = list.children[currentUserIndex];
            if (userItem) userItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }

    // SSE status indicator removed
}
function createRankingItem(u, i) { const item = document.createElement('div'); const rank = i + 1; const isMe = u.userId === currentUser?._id; let rC = ''; if (rank === 1) rC = 'rank-gold'; else if (rank === 2) rC = 'rank-silver'; else if (rank === 3) rC = 'rank-bronze'; item.className = `ranking-item ${rC} ${isMe ? 'current-user' : ''}`; item.dataset.userId = u.userId || ''; item.innerHTML = `<span class="rank">${rank}</span><img src="${getFullAssetUrl(u.avatar)}" alt="${u.name||'?'}" class="rank-avatar" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=?';"><span class="rank-name">${u.name||'Anon'} ${isMe?`(${getTranslation('you')})`:''}</span><span class="rank-points">${u.points||0} ${getTranslation('points')}</span><span class="rank-level">(Lv. ${u.level||1})</span>`; return item; }
function updateRankingScrollButtons() { const l = document.getElementById('ranking-list'); const up = document.querySelector('.scroll-up-btn'); const down = document.querySelector('.scroll-down-btn'); if (!l || !up || !down) return; up.disabled = l.scrollTop <= 0; down.disabled = l.scrollTop + l.clientHeight >= l.scrollHeight - 2; }
function scrollRanking(dir) { const l = document.getElementById('ranking-list'); if (!l) return; const h = l.querySelector('.ranking-item')?.offsetHeight || 70; l.scrollBy({ top: h * 2 * dir, behavior: 'smooth' }); setTimeout(updateRankingScrollButtons, 350); }
function startScrollRankingDown() { stopScrollRanking(); scrollRanking(1); rankingScrollInterval = setInterval(() => scrollRanking(1), 400); }
function startScrollRankingUp() { stopScrollRanking(); scrollRanking(-1); rankingScrollInterval = setInterval(() => scrollRanking(-1), 400); }
function stopScrollRanking() { clearInterval(rankingScrollInterval); rankingScrollInterval = null; updateRankingScrollButtons(); }

// --- Teacher Dashboard ---
async function fetchTeacherSubmissions() {
    if (!currentUser || currentUser.role !== 'teacher') {
        clearTeacherSubmissionsUI();
        return;
    }

    console.log("Fetching submissions and feedback...");
    const submissionsList = document.getElementById('feedback-list');
    const feedbackList = document.getElementById('teacher-feedback-list');

    if (submissionsList) {
        submissionsList.innerHTML = `<p class="loading-message">${getTranslation('loading-submissions')}</p>`;
    }

    if (feedbackList) {
        feedbackList.innerHTML = `<p class="loading-message">${getTranslation('loading-feedback')}</p>`;
    }

    try {
        // Fetch all submissions from MongoDB API - only student submissions
        const submissionsResponse = await apiFetch('/api/submissions?status=pending&type=challenge&limit=100');
        let allSubmissions = [];

        // Check if the response has a submissions property or is an array directly
        if (submissionsResponse.ok) {
            const responseData = await submissionsResponse.json();

            // Handle both array format and { submissions: [...] } format
            if (Array.isArray(responseData)) {
                allSubmissions = responseData;
            } else if (responseData.submissions && Array.isArray(responseData.submissions)) {
                allSubmissions = responseData.submissions;
            }

            console.log(`Loaded ${allSubmissions.length} submissions from MongoDB`);
        }

        // Render the submissions
        renderTeacherFeedbackList(allSubmissions);

        // Fetch feedback
        const feedbackResponse = await apiFetch('/api/feedback?limit=50');
        const feedback = await feedbackResponse.json() || [];
        renderTeacherFeedbackItems(feedback);
    } catch (err) {
        console.error('Fetch teacher data error:', err);
        clearTeacherSubmissionsUI('fetch-submissions-error');
        clearTeacherFeedbackUI('fetch-feedback-error');
        if (err.message !== getTranslation('session-expired')) {
            showNotification(getTranslation('fetch-submissions-error'), 'error');
        }
    }
}
// Enhanced function to create teacher feedback items with better challenge support
function createEnhancedTeacherFeedbackItem(s) {
    const d = document.createElement('div');
    d.className = `feedback-item teacher-review-item ${s.type === 'challenge' ? 'challenge-submission' : ''}`;
    d.dataset.submissionId = s._id || '';
    d.dataset.submissionType = s.type || 'submission';

    // Ensure we have the full URL to the file
    // Sửa đổi: Đảm bảo URL đúng định dạng và truy cập được
    // Sử dụng URL cố định với API_URL
    const url = API_URL + (s.url.startsWith('/') ? s.url : '/' + s.url);
    const date = s.createdAt ? new Date(s.createdAt).toLocaleString() : 'N/A';
    const name = s.userName || s.userEmail || 'Unknown';
    const title = s.relatedTitle || 'N/A';
    const type = getTranslation(s.type || 'submission');
    const points = s.type === 'challenge' ? (s.challengePoints || 15) : 10;
    const originalFilename = s.originalFilename || 'file';

    // Hiển thị thông tin debug (chỉ hiển thị khi cần debug)
    console.log(`Rendering submission: ${s._id}, URL: ${url}, File: ${originalFilename}`);

    let preview = '';
    const ext = s.url?.split('.').pop().toLowerCase();

    // Hiển thị thông tin file gốc và nút tải xuống
    preview = `<div class="submission-file-info">
        <p><strong>File:</strong> ${originalFilename}</p>
        <p><a href="${url}" download="${originalFilename}" class="download-btn"><i class="fas fa-download"></i> Tải xuống file</a></p>
    </div>`;

    // Hiển thị hình ảnh hoặc video trực tiếp với cách đơn giản hơn
    if (ALLOWED_AVATAR_EXTENSIONS.includes(ext)) {
        // Hiển thị hình ảnh
        preview += `<div class="image-container">
            <img src="${url}" alt="${originalFilename}" class="feedback-preview-image">
        </div>`;
    } else if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
        // Hiển thị video
        preview += `<div class="video-container">
            <video controls class="feedback-video">
                <source src="${url}" type="video/${ext === 'mov' ? 'mp4' : ext}">
                ${getTranslation('video-not-supported')}
            </video>
        </div>`;
    } else if (['pdf'].includes(ext)) {
        // Hiển thị PDF viewer
        preview += `<div class="pdf-container">
            <iframe src="${url}" width="100%" height="500px" style="border: none;"></iframe>
        </div>`;
    } else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
        // Hiển thị Google Docs viewer cho các file Office
        const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        preview += `<div class="doc-container">
            <iframe src="${googleViewerUrl}" width="100%" height="500px" style="border: none;"></iframe>
        </div>`;
    } else if (['txt', 'js', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'cs', 'php'].includes(ext)) {
        // Hiển thị nút để xem nội dung file text
        preview += `<div class="text-file-preview">
            <button class="view-text-file-btn" onclick="fetchAndDisplayTextFile('${url}', '${originalFilename}')">Xem nội dung file</button>
        </div>`;
    } else {
        // Các loại file khác - hiển thị link tải xuống
        preview += `<div class="download-container">
            <p><a href="${url}" target="_blank" rel="noopener noreferrer" class="download-link"><i class="fas fa-download"></i> ${getTranslation('download')} ${originalFilename}</a></p>
        </div>`;
    }

    // Create a badge for challenge submissions
    const typeBadge = s.type === 'challenge' ?
        `<span class="submission-type-badge challenge">${type}</span>` :
        `<span class="submission-type-badge">${type}</span>`;

    d.innerHTML = `
        <div class="feedback-header">
            <div>
                <span><strong>From:</strong> ${name}</span>
                <div class="submission-meta">
                    ${typeBadge}
                    <span><strong>Related:</strong> ${title}</span>
                </div>
            </div>
            <span><strong>${getTranslation('submitted')}:</strong> ${date}</span>
        </div>
        <div class="feedback-content-teacher">
            <div class="preview-container">${preview}</div>
            <div class="feedback-details">
                <p><strong>${getTranslation('student-note')}:</strong> ${s.note || `<i>(${getTranslation('none')})</i>`}</p>
                <form class="teacher-review-form" data-submission-id="${s._id}">
                    <div class="input-group">
                        <textarea class="teacher-comment input-field" name="teacherComment" placeholder="${getTranslation('teacher-comment-placeholder')}" rows="3" required></textarea>
                    </div>
                    <div class="review-actions">
                        <div class="input-group points-input">
                            <label for="points-${s._id}">${getTranslation('points-to-award')}:</label>
                            <input type="number" id="points-${s._id}" name="pointsAwarded" placeholder="e.g., ${points}" min="0" value="${points}">
                        </div>
                        <div class="action-buttons">
                            <button type="submit" class="action-btn approve-btn ripple-btn" name="status" value="approved">
                                <i class="fas fa-check"></i> ${getTranslation('approve')}
                            </button>
                            <button type="submit" class="action-btn reject-btn ripple-btn" name="status" value="rejected">
                                <i class="fas fa-times"></i> ${getTranslation('reject')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>`;

    // Add event listener for the form submission
    const form = d.querySelector('.teacher-review-form');
    if (form) {
        form.addEventListener('submit', handleReviewSubmit);
    }

    return d;
}

function renderTeacherFeedbackList(subs) {
    const list = document.getElementById('feedback-list');
    if (!list) return;
    list.innerHTML = '';

    if (!subs || subs.length === 0) {
        list.innerHTML = `<p class="placeholder">${getTranslation('no-videos-for-feedback')}</p>`;
        return;
    }

    // Filter for pending submissions only
    const pendingSubs = subs.filter(s => s.status === 'pending' || !s.status);

    if (pendingSubs.length === 0) {
        list.innerHTML = `<p class="placeholder">${getTranslation('no-pending-submissions')}</p>`;
        return;
    }

    // Chỉ hiển thị bài nộp của sinh viên (challenge submissions)
    // Sort by date (newest first)
    pendingSubs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Add a header for student submissions
    const header = document.createElement('div');
    header.className = 'submissions-section-header';
    header.innerHTML = `<h3>${getTranslation('challenges')} (${pendingSubs.length})</h3>`;
    list.appendChild(header);

    // Add all student submissions
    pendingSubs.forEach(s => {
        const el = createEnhancedTeacherFeedbackItem(s);
        list.appendChild(el);
        if (anime) anime({ targets: el, opacity: [0, 1], scale: [0.9, 1], duration: 500, easing: 'easeOutExpo' });
    });
}
function createTeacherFeedbackItem(s) {
    const d = document.createElement('div');
    d.className = `feedback-item teacher-review-item ${s.type === 'challenge' ? 'challenge-submission' : ''}`;
    d.dataset.submissionId = s._id || '';
    d.dataset.submissionType = s.type || 'submission';

    // Ensure we have the full URL to the file
    // Sửa đổi: Đảm bảo URL đúng định dạng và truy cập được
    // Sử dụng URL cố định với API_URL
    const url = API_URL + (s.url.startsWith('/') ? s.url : '/' + s.url);
    const date = s.createdAt ? new Date(s.createdAt).toLocaleString() : 'N/A';
    const name = s.userName || s.userEmail || 'Unknown';
    const title = s.relatedTitle || 'N/A';
    const type = getTranslation(s.type || 'submission');
    const points = s.type === 'challenge' ? (s.challengePoints || 15) : 10;
    const originalFilename = s.originalFilename || 'file';

    // Hiển thị thông tin debug (chỉ hiển thị khi cần debug)
    console.log(`Rendering submission: ${s._id}, URL: ${url}, File: ${originalFilename}`);

    let preview = '';
    const ext = s.url?.split('.').pop().toLowerCase();

    // Hiển thị thông tin file gốc và nút tải xuống
    preview = `<div class="submission-file-info">
        <p><strong>File:</strong> ${originalFilename}</p>
        <p><a href="${url}" download="${originalFilename}" class="download-btn"><i class="fas fa-download"></i> Tải xuống file</a></p>
    </div>`;

    // Hiển thị hình ảnh hoặc video trực tiếp với cách đơn giản hơn
    if (ALLOWED_AVATAR_EXTENSIONS.includes(ext)) {
        // Hiển thị hình ảnh
        preview += `<div class="image-container">
            <img src="${url}" alt="${originalFilename}" class="feedback-preview-image">
        </div>`;
    } else if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
        // Hiển thị video
        preview += `<div class="video-container">
            <video controls class="feedback-video">
                <source src="${url}" type="video/${ext === 'mov' ? 'mp4' : ext}">
                ${getTranslation('video-not-supported')}
            </video>
        </div>`;
    } else if (['pdf'].includes(ext)) {
        // Hiển thị PDF viewer
        preview += `<div class="pdf-container">
            <iframe src="${url}" width="100%" height="500px" style="border: none;"></iframe>
        </div>`;
    } else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
        // Hiển thị Google Docs viewer cho các file Office
        const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        preview += `<div class="doc-container">
            <iframe src="${googleViewerUrl}" width="100%" height="500px" style="border: none;"></iframe>
        </div>`;
    } else if (['txt', 'js', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'cs', 'php'].includes(ext)) {
        // Hiển thị nút để xem nội dung file text
        preview += `<div class="text-file-preview">
            <button class="view-text-file-btn" onclick="fetchAndDisplayTextFile('${url}', '${originalFilename}')">Xem nội dung file</button>
        </div>`;
    } else {
        // Các loại file khác - hiển thị link tải xuống
        preview += `<div class="download-container">
            <p><a href="${url}" target="_blank" rel="noopener noreferrer" class="download-link"><i class="fas fa-download"></i> ${getTranslation('download')} ${originalFilename}</a></p>
        </div>`;
    }

    // Create a badge for challenge submissions
    const typeBadge = s.type === 'challenge' ?
        `<span class="submission-type-badge challenge">${type}</span>` :
        `<span class="submission-type-badge">${type}</span>`;

    d.innerHTML = `
        <div class="feedback-header">
            <div>
                <span><strong>From:</strong> ${name}</span>
                <div class="submission-meta">
                    ${typeBadge}
                    <span><strong>Related:</strong> ${title}</span>
                </div>
            </div>
            <span><strong>${getTranslation('submitted')}:</strong> ${date}</span>
        </div>
        <div class="feedback-content-teacher">
            <div class="preview-container">${preview}</div>
            <div class="feedback-details">
                <p><strong>${getTranslation('student-note')}:</strong> ${s.note || `<i>(${getTranslation('none')})</i>`}</p>
                <form class="teacher-review-form" data-submission-id="${s._id}">
                    <div class="input-group">
                        <textarea class="teacher-comment input-field" name="teacherComment" placeholder="${getTranslation('teacher-comment-placeholder')}" rows="3" required></textarea>
                    </div>
                    <div class="review-actions">
                        <div class="input-group points-input">
                            <label for="points-${s._id}">${getTranslation('points-to-award')}:</label>
                            <input type="number" id="points-${s._id}" name="pointsAwarded" placeholder="e.g., ${points}" min="0" value="${points}">
                        </div>
                        <div class="action-buttons">
                            <button type="submit" class="action-btn approve-btn ripple-btn" name="status" value="approved">
                                <i class="fas fa-check"></i> ${getTranslation('approve')}
                            </button>
                            <button type="submit" class="action-btn reject-btn ripple-btn" name="status" value="rejected">
                                <i class="fas fa-times"></i> ${getTranslation('reject')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>`;

    return d;
}
function clearTeacherSubmissionsUI(key = 'no-videos-for-feedback') { const l = document.getElementById('feedback-list'); if (l) { l.innerHTML = `<p class="placeholder ${key.includes('error') ? 'error' : ''}">${getTranslation(key)}</p>`; } }
async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'teacher') return;

    const form = e.target.closest('.teacher-review-form');
    if (!form) return;

    const id = form.dataset.submissionId;
    const btn = e.submitter;
    if (!btn || btn.name !== 'status') return;

    const status = btn.value;
    const commentIn = form.querySelector('.teacher-comment');
    const pointsIn = form.querySelector('input[name="pointsAwarded"]');
    const comment = commentIn.value.trim();
    let pts = 0;

    // Remove any previous error styling
    commentIn.classList.remove('error');

    // Require comment for rejection
    if (status === 'rejected' && !comment) {
        showNotification(getTranslation('enter-comment-reject'), 'error');
        commentIn.classList.add('error');
        commentIn.focus();
        return;
    }

    // Get points value if approving
    if (status === 'approved') {
        pts = Math.max(0, parseInt(pointsIn.value || '0', 10));
        if (isNaN(pts)) pts = 0;
    }

    // Get the submission item to determine if it's a challenge
    const submissionItem = form.closest('.teacher-review-item');
    const isChallenge = submissionItem && submissionItem.classList.contains('challenge-submission');

    console.log(`Review ${id}: ${status}, Pts: ${pts}, Challenge: ${isChallenge}`);

    // Disable form elements during submission
    const formElements = form.querySelectorAll('button, textarea, input');
    formElements.forEach(el => el.disabled = true);

    showLoading();

    try {
        // Prepare the review data for MongoDB
        const reviewData = {
            status,
            teacherComment: comment,
            pointsAwarded: pts,
            teacherId: currentUser._id,
            teacherName: currentUser.name,
            reviewedAt: new Date().toISOString()
        };

        // Send the review to the MongoDB API
        const r = await apiFetch(`/api/submissions/${id}/review`, {
            method: 'PUT',
            body: JSON.stringify(reviewData)
        });

        if (!r.ok) {
            const errorData = await r.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${r.status}`);
        }

        // Show appropriate success message based on submission type
        if (isChallenge) {
            if (status === 'approved') {
                showNotification(`${getTranslation('challenge')} ${getTranslation('approved')}! +${pts} ${getTranslation('points')}`, 'success');
            } else {
                showNotification(`${getTranslation('challenge')} ${getTranslation('rejected')}`, 'success');
            }
        } else {
            showNotification(getTranslation('review-success'), 'success');
        }

        // Remove the reviewed item from UI
        removeReviewedItemFromUI(id);

        // Refresh analytics after review
        fetchTeacherAnalytics();
    } catch (err) {
        console.error("Review err:", err);

        // Re-enable form elements if there's an error
        formElements.forEach(el => el.disabled = false);

        if (err.message !== getTranslation('session-expired')) {
            showNotification(err.message || getTranslation('review-error'), 'error');
        }
    } finally {
        hideLoading();
    }
}
function removeReviewedItemFromUI(id) {
    const item = document.querySelector(`.feedback-item[data-submission-id="${id}"]`);
    if (!item) return;

    if (anime) {
        anime({
            targets: item,
            opacity: 0,
            height: 0,
            padding: 0,
            margin: 0,
            duration: 400,
            easing: 'easeOutQuad',
            complete: () => {
                item.remove();
                checkEmptyTeacherList();
            }
        });
    } else {
        item.remove();
        checkEmptyTeacherList();
    }
}

function checkEmptyTeacherList() {
    const l = document.getElementById('feedback-list');
    if (l && !l.querySelector('.feedback-item')) {
        l.innerHTML = `<p class="placeholder">${getTranslation('no-videos-for-feedback')}</p>`;
    }
}

// Teacher feedback functions
function renderTeacherFeedbackItems(feedbackItems) {
    const list = document.getElementById('teacher-feedback-list');
    if (!list) return;

    list.innerHTML = '';

    if (!feedbackItems || feedbackItems.length === 0) {
        list.innerHTML = `<p class="placeholder">${getTranslation('no-feedback-submitted')}</p>`;
        return;
    }

    // Sort by date (newest first)
    feedbackItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    feedbackItems.forEach(feedback => {
        const el = createTeacherFeedbackResponseItem(feedback);
        list.appendChild(el);

        if (anime) {
            anime({
                targets: el,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 500,
                easing: 'easeOutQuad'
            });
        }
    });
}

function createTeacherFeedbackResponseItem(feedback) {
    const item = document.createElement('div');
    item.className = `feedback-item teacher-feedback-item status-${feedback.status || 'pending'}`;
    item.dataset.feedbackId = feedback._id || '';

    const date = feedback.createdAt ? new Date(feedback.createdAt).toLocaleString() : 'N/A';
    const userName = feedback.userName || 'Anonymous';
    const userEmail = feedback.userEmail || 'No email';
    const statusText = getTranslation(feedback.status || 'pending');

    item.innerHTML = `
        <div class="feedback-header">
            <div>
                <span><strong>From:</strong> ${userName} (${userEmail})</span>
                <span><strong>Status:</strong> <span class="status-badge ${feedback.status || 'pending'}">${statusText}</span></span>
            </div>
            <span><strong>${getTranslation('submitted')}:</strong> ${date}</span>
        </div>
        <div class="feedback-content-teacher">
            <div class="feedback-details">
                <p><strong>${getTranslation('feedback')}:</strong> ${feedback.text || 'N/A'}</p>

                ${feedback.reply ? `
                <div class="teacher-reply">
                    <p><strong>${getTranslation('your-reply')}:</strong> ${feedback.reply}</p>
                    <p class="reply-date">${getTranslation('replied')}: ${feedback.repliedAt ? new Date(feedback.repliedAt).toLocaleString() : 'N/A'}</p>
                </div>
                ` : `
                <form class="teacher-reply-form" data-feedback-id="${feedback._id}">
                    <div class="input-group">
                        <textarea class="teacher-reply-text input-field" name="replyText" placeholder="${getTranslation('reply-placeholder')}" rows="3" required></textarea>
                    </div>
                    <div class="reply-actions">
                        <div class="action-buttons">
                            <button type="submit" class="action-btn reply-btn ripple-btn">
                                <i class="fas fa-reply"></i> ${getTranslation('reply')}
                            </button>
                            <button type="button" class="action-btn notify-btn ripple-btn" data-feedback-id="${feedback._id}">
                                <i class="fas fa-envelope"></i> ${getTranslation('notify')}
                            </button>
                        </div>
                    </div>
                </form>
                `}
            </div>
        </div>
    `;

    // Add event listeners for reply form and notify button
    const replyForm = item.querySelector('.teacher-reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', handleFeedbackReply);
    }

    const notifyBtn = item.querySelector('.notify-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', handleFeedbackNotify);
    }

    return item;
}

async function handleFeedbackReply(e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== 'teacher') return;

    const form = e.target;
    const feedbackId = form.dataset.feedbackId;
    const replyText = form.querySelector('.teacher-reply-text').value.trim();

    if (!replyText) {
        showNotification(getTranslation('reply-text-empty'), 'error');
        return;
    }

    showLoading();

    try {
        const response = await apiFetch(`/api/feedback/${feedbackId}/reply`, {
            method: 'POST',
            body: JSON.stringify({ reply: replyText })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(getTranslation('reply-sent-success'), 'success');
            // Refresh the feedback list
            fetchTeacherSubmissions();
        } else {
            showNotification(result.message || getTranslation('reply-error'), 'error');
        }
    } catch (err) {
        console.error('Error replying to feedback:', err);
        showNotification(getTranslation('reply-error'), 'error');
    } finally {
        hideLoading();
    }
}

async function handleFeedbackNotify(e) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'teacher') return;

    const btn = e.target.closest('.notify-btn');
    if (!btn) return;

    const feedbackId = btn.dataset.feedbackId;
    if (!feedbackId) return;

    // Disable the button to prevent multiple clicks
    btn.disabled = true;

    // Add a data attribute to track notification status
    btn.dataset.notified = 'pending';

    showLoading();

    try {
        const response = await apiFetch(`/api/feedback/${feedbackId}/notify`, {
            method: 'POST',
            body: JSON.stringify({
                teacherId: currentUser._id,
                teacherName: currentUser.name,
                notifiedAt: new Date().toISOString()
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(getTranslation('notification-sent'), 'success');
            // Mark as notified
            btn.dataset.notified = 'true';
            btn.innerHTML = `<i class="fas fa-check"></i> ${getTranslation('notified')}`;
            btn.classList.add('notified');
        } else {
            showNotification(result.message || getTranslation('notification-error'), 'error');
            btn.dataset.notified = 'false';
            btn.disabled = false;
        }
    } catch (err) {
        console.error('Error sending notification:', err);
        showNotification(getTranslation('notification-error'), 'error');
        btn.dataset.notified = 'false';
        btn.disabled = false;
    } finally {
        hideLoading();
    }
}

function clearTeacherFeedbackUI(key = 'no-feedback-submitted') {
    const list = document.getElementById('teacher-feedback-list');
    if (list) {
        list.innerHTML = `<p class="placeholder ${key.includes('error') ? 'error' : ''}">${getTranslation(key)}</p>`;
    }
}

// Hàm để lấy và hiển thị nội dung file text
async function fetchAndDisplayTextFile(url, filename) {
    try {
        showLoading();
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();

        // Tạo modal để hiển thị nội dung file
        const modal = document.createElement('div');
        modal.className = 'modal text-file-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${filename}</h3>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <pre class="text-file-content">${escapeHtml(text)}</pre>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Thêm sự kiện để đóng modal
        const closeBtn = modal.querySelector('.close-modal-btn');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Đóng modal khi click bên ngoài
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error fetching text file:', error);
        showNotification('Error loading file content', 'error');
    } finally {
        hideLoading();
    }
}

// Hàm escape HTML để tránh XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Handle teacher dashboard tab clicks
function handleTeacherTabClick(e) {
    const tab = e.target;
    const tabName = tab.dataset.tab;

    if (!tabName) return;

    // Update active tab button
    document.querySelectorAll('.teacher-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    tab.classList.add('active');

    // Update active tab content
    document.querySelectorAll('.teacher-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    // Load data for the selected tab if needed
    if (tabName === 'submissions') {
        // Already loaded in fetchTeacherSubmissions
    } else if (tabName === 'feedback') {
        // Already loaded in fetchTeacherSubmissions
    } else if (tabName === 'students') {
        fetchTeacherStudents();
    }
}

// --- Teacher Analytics & Student Management (NEW - Requires corresponding HTML in index.html) ---
async function fetchTeacherAnalytics() { /* Keep existing fetch logic */ if(!currentUser||currentUser.role!=='teacher')return;console.log("Fetching analytics...");const c=document.getElementById('teacher-analytics-container');if(c)c.innerHTML=`<p class="loading-message">${getTranslation('loading-analytics')}</p>`;try{const r=await apiFetch('/api/teacher/analytics');teacherAnalytics=await r.json();renderTeacherAnalytics();}catch(err){console.error("Fetch analytics err:",err);if(c)c.innerHTML=`<p class="placeholder error">${getTranslation('fetch-analytics-error')}</p>`;showNotification(getTranslation('fetch-analytics-error'),'error');}}
function renderTeacherAnalytics() { /* Keep existing render logic */ const c=document.getElementById('teacher-analytics-container');if(!c)return;if(!teacherAnalytics){c.innerHTML=`<p class="placeholder">${getTranslation('no-analytics')}</p>`;return;}c.innerHTML=`<h4>${getTranslation('teacher-analytics')}</h4> <p>${getTranslation('total-reviewed')}: ${teacherAnalytics.totalReviewed??0}</p><p>${getTranslation('approved-count')}: ${teacherAnalytics.approvedCount??0}</p><p>${getTranslation('rejected-count')}: ${teacherAnalytics.rejectedCount??0}</p><p>${getTranslation('pending-submissions')}: ${teacherAnalytics.pendingSubmissions??0}</p><p>${getTranslation('associated-students')}: ${teacherAnalytics.associatedStudents??0}</p> <button id="view-students-btn" class="action-btn ripple-btn">${getTranslation('students-list')}</button>`;c.querySelector('#view-students-btn')?.addEventListener('click',fetchTeacherStudents);applyTranslations(c);}

// Fetch and display teacher's students
async function fetchTeacherStudents() {
    if (!currentUser || currentUser.role !== 'teacher') return;

    console.log("Fetching students list...");
    const list = document.getElementById('teacher-students-list');

    if (list) {
        list.innerHTML = `<p class="loading-message">${getTranslation('loading-students')}</p>`;
    }

    // Switch to the students tab
    document.querySelectorAll('.teacher-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const studentsTab = document.querySelector('.teacher-tab-btn[data-tab="students"]');
    if (studentsTab) {
        studentsTab.classList.add('active');
    }

    document.querySelectorAll('.teacher-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const studentsContent = document.getElementById('students-tab');
    if (studentsContent) {
        studentsContent.classList.add('active');
    }

    try {
        const response = await apiFetch('/api/teacher/students');
        const students = await response.json();

        renderTeacherStudentsList(students);
    } catch (err) {
        console.error('Fetch students error:', err);
        if (list) {
            list.innerHTML = `<p class="placeholder error">${getTranslation('fetch-students-error')}</p>`;
        }
        showNotification(getTranslation('fetch-students-error'), 'error');
    }
}

function renderTeacherStudentsList(students) {
    const list = document.getElementById('teacher-students-list');
    if (!list) return;

    if (!students || students.length === 0) {
        list.innerHTML = `<p class="placeholder">${getTranslation('no-students')}</p>`;
        return;
    }

    list.innerHTML = `<h4>${getTranslation('students-list')}</h4><div class="students-grid"></div>`;
    const grid = list.querySelector('.students-grid');

    students.forEach(student => {
        const studentCard = createStudentCard(student);
        grid.appendChild(studentCard);

        if (anime && !studentCard.dataset.animated) {
            anime({
                targets: studentCard,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 500,
                easing: 'easeOutQuad'
            });
            studentCard.dataset.animated = true;
        }
    });
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.dataset.studentId = student._id || '';

    const progress = student.progress || 0;
    const level = student.level || 1;

    card.innerHTML = `
        <div class="student-avatar" style="background-image: url('${getFullAssetUrl(student.avatar || 'default-avatar.png')}');"></div>
        <div class="student-info">
            <h4>${student.name || 'Student'}</h4>
            <p><strong>${getTranslation('level')}:</strong> ${level}</p>
            <p><strong>${getTranslation('progress')}:</strong> ${progress}%</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="student-actions">
                <button class="view-student-btn action-btn ripple-btn" data-student-id="${student._id}">
                    <i class="fas fa-eye"></i> ${getTranslation('view-details')}
                </button>
                <button class="update-progress-btn action-btn ripple-btn" data-student-id="${student._id}">
                    <i class="fas fa-chart-line"></i> ${getTranslation('update-progress')}
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    card.querySelector('.view-student-btn').addEventListener('click', () => viewStudentDetails(student._id));
    card.querySelector('.update-progress-btn').addEventListener('click', () => openUpdateProgressModal(student));

    return card;
}

async function viewStudentDetails(studentId) {
    if (!studentId) return;
    if (!currentUser || currentUser.role !== 'teacher') return;

    const detailsContainer = document.getElementById('teacher-student-details');
    if (!detailsContainer) return;

    detailsContainer.innerHTML = `<p class="loading-message">${getTranslation('loading')}...</p>`;
    showLoading();

    try {
        // Use the teacher API endpoint to get student details
        const response = await apiFetch(`/api/teacher/students/${studentId}`);
        const student = await response.json();

        renderStudentDetails(student);
    } catch (err) {
        console.error('Fetch student details error:', err);
        detailsContainer.innerHTML = `<p class="placeholder error">${getTranslation('fetch-profile-error')}</p>`;
        showNotification(getTranslation('fetch-profile-error'), 'error');
    } finally {
        hideLoading();
    }
}

function renderStudentDetails(student) {
    const container = document.getElementById('teacher-student-details');
    if (!container) return;

    const progress = student.progress || 0;
    const level = student.level || 1;
    const points = student.points || 0;
    const streak = student.loginStreak || 0;
    const courses = student.courses || [];
    const achievements = student.achievements || [];
    const lastActive = student.lastActive ? new Date(student.lastActive).toLocaleString() : 'N/A';
    const joinDate = student.joinDate ? new Date(student.joinDate).toLocaleString() : 'N/A';

    container.innerHTML = `
        <h4>${getTranslation('student-details')}</h4>
        <div class="student-detail-card">
            <div class="student-header">
                <div class="student-avatar-large" style="background-image: url('${getFullAssetUrl(student.avatar || 'default-avatar.png')}');"></div>
                <div>
                    <h3>${student.name || 'Student'}</h3>
                    <p>${student.email || ''}</p>
                </div>
            </div>

            <div class="student-stats">
                <div class="stat-item">
                    <span class="stat-label">${getTranslation('level')}</span>
                    <span class="stat-value">${level}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">${getTranslation('points')}</span>
                    <span class="stat-value">${points}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">${getTranslation('streak-text')}</span>
                    <span class="stat-value">${streak} ${getTranslation('days')}</span>
                </div>
            </div>

            <div class="student-progress">
                <h4>${getTranslation('progress')}: ${progress}%</h4>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>

            <div class="student-activity">
                <h4>${getTranslation('activity')}</h4>
                <p><strong>${getTranslation('last-active')}:</strong> ${lastActive}</p>
                <p><strong>${getTranslation('join-date')}:</strong> ${joinDate}</p>
            </div>

            <div class="student-courses">
                <h4>${getTranslation('courses')}</h4>
                ${courses.length > 0 ?
                    `<ul>${courses.map(course => `<li>${course}</li>`).join('')}</ul>` :
                    `<p>${getTranslation('no-courses')}</p>`
                }
            </div>

            <div class="student-achievements">
                <h4>${getTranslation('achievements')}</h4>
                ${achievements.length > 0 ?
                    `<ul>${achievements.map(achievement => `<li>${achievement}</li>`).join('')}</ul>` :
                    `<p>${getTranslation('no-achievements')}</p>`
                }
            </div>

            <div class="student-detail-actions">
                <button class="update-progress-btn action-btn ripple-btn" data-student-id="${student._id}">
                    <i class="fas fa-chart-line"></i> ${getTranslation('update-progress')}
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    container.querySelector('.update-progress-btn').addEventListener('click', () => openUpdateProgressModal(student));
}

function openUpdateProgressModal(student) {
    if (!student || !student._id) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'update-progress-modal';

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>${getTranslation('update-progress')}</h3>
            <p>${student.name} - ${getTranslation('current')}: ${student.progress || 0}%</p>

            <form id="update-progress-form">
                <div class="input-group">
                    <label for="new-progress">${getTranslation('new-progress-value')}</label>
                    <input type="number" id="new-progress" class="input-field" min="0" max="100" value="${student.progress || 0}" required>
                </div>

                <div class="form-actions">
                    <button type="submit" class="action-btn ripple-btn">${getTranslation('update')}</button>
                    <button type="button" class="cancel-btn action-btn ripple-btn">${getTranslation('cancel')}</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    animateModalOpen(modal);

    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => closeModal(modal));
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });

    const form = modal.querySelector('#update-progress-form');
    form.addEventListener('submit', (e) => handleProgressUpdate(e, student._id));
}

async function handleProgressUpdate(e, studentId) {
    e.preventDefault();

    if (!studentId) return;

    const progressInput = document.getElementById('new-progress');
    const newProgress = parseInt(progressInput.value);

    if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
        showNotification(getTranslation('invalid-request'), 'error');
        return;
    }

    showLoading();

    try {
        await apiFetch(`/api/users/${studentId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({ progress: newProgress })
        });

        showNotification(getTranslation('progress-updated-success'), 'success');
        closeModal(document.getElementById('update-progress-modal'));

        // Refresh the student list and details
        fetchTeacherStudents();
    } catch (err) {
        console.error('Update progress error:', err);
        showNotification(getTranslation('progress-update-error'), 'error');
    } finally {
        hideLoading();
    }
}
function clearTeacherAnalyticsUI() { const c=document.getElementById('teacher-analytics-container');if(c)c.innerHTML='';}
async function fetchTeacherStudents() {
    if (!currentUser || currentUser.role !== 'teacher') return;
    console.log("Fetching students...");
    const l = document.getElementById('teacher-students-list');
    if (l) l.innerHTML = `<p>${getTranslation('loading-students')}</p>`;
    try {
        // Sử dụng API /api/users thay vì /api/teacher/students
        const r = await apiFetch('/api/users?role=student');
        teacherStudents = await r.json();
        renderTeacherStudents();
    } catch (err) {
        console.error("Fetch students err:", err);
        if (l) l.innerHTML = `<p class="error">${getTranslation('fetch-students-error')}</p>`;
        showNotification(getTranslation('fetch-students-error'), 'error');
    }
}
function renderTeacherStudents() { /* Keep existing render logic */ const l=document.getElementById('teacher-students-list');if(!l)return;if(!teacherStudents||teacherStudents.length===0){l.innerHTML=`<p class="placeholder">${getTranslation('no-students')}</p>`;return;}l.innerHTML=`<h4>${getTranslation('students-list')}</h4><ul>${teacherStudents.map(s=>`<li><img src="${getFullAssetUrl(s.avatar)}" alt="${s.name}" class="rank-avatar small"><span>${s.name} (${s.email})</span> <button class="view-details-btn action-btn" data-id="${s._id}">${getTranslation('view-details')}</button></li>`).join('')}</ul>`;l.querySelectorAll('.view-details-btn').forEach(b=>b.addEventListener('click',(e)=>fetchStudentDetails(e.target.dataset.id)));applyTranslations(l);}
function clearTeacherStudentsUI() { const l=document.getElementById('teacher-students-list');if(l)l.innerHTML='';const d=document.getElementById('teacher-student-details');if(d)d.innerHTML='';}
async function fetchStudentDetails(id) {
    if (!currentUser || currentUser.role !== 'teacher' || !id) return;
    console.log(`Fetching details for student: ${id}`);
    const d = document.getElementById('teacher-student-details');
    if (d) d.innerHTML = `<p>${getTranslation('loading-profile')}</p>`;
    showLoading();
    try {
        // Sử dụng API /api/users/:id thay vì /api/teacher/students/:id
        const r = await apiFetch(`/api/users/${id}`);
        const sData = await r.json();
        renderStudentDetails(sData);
    } catch (err) {
        console.error(`Fetch student details err ${id}:`, err);
        if (d) d.innerHTML = `<p class="error">${getTranslation('fetch-profile-error')}</p>`;
        showNotification(getTranslation('fetch-profile-error'), 'error');
    } finally {
        hideLoading();
    }
}
function renderStudentDetails(s) { /* Keep existing render logic */ const el=document.getElementById('teacher-student-details');if(!el||!s){if(el)el.innerHTML='';return;}el.innerHTML=`<h4>${getTranslation('student-details')}</h4> <p><strong>${getTranslation('name')}:</strong> ${s.name}</p> <p><strong>${getTranslation('email')}:</strong> ${s.email}</p> <p><strong>${getTranslation('points')}:</strong> ${s.points??0}</p> <p><strong>${getTranslation('level')}:</strong> ${s.level??1}</p> <p><strong>${getTranslation('progress')}:</strong> ${s.progress??0}%</p> <div class="input-group"><label for="sp-${s._id}">${getTranslation('update-progress')}:</label><input type="number" id="sp-${s._id}" min="0" max="100" value="${s.progress??0}"><button class="update-progress-btn action-btn" data-id="${s._id}">${getTranslation('update')}</button><span id="upe-${s._id}" class="error-message"></span></div>`;el.querySelector('.update-progress-btn')?.addEventListener('click',handleUpdateStudentProgress);applyTranslations(el);}
async function handleUpdateStudentProgress(e) {
    const id = e.target.dataset.id;
    const input = document.getElementById(`sp-${id}`);
    const errEl = document.getElementById(`upe-${id}`);
    if (!id || !input || !errEl) return;
    errEl.textContent = '';

    let prog;
    try {
        prog = parseInt(input.value, 10);
        if (isNaN(prog) || prog < 0 || prog > 100) throw new Error();
    } catch {
        errEl.textContent = 'Giá trị 0-100.';
        return;
    }

    showLoading();
    try {
        // Sử dụng API /api/users/:id thay vì /api/teacher/students/:id/progress
        await apiFetch(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ progress: prog })
        });
        showNotification(getTranslation('progress-updated-success'), 'success');
        fetchStudentDetails(id);
    } catch (err) {
        console.error(`Update progress err for ${id}:`, err);
        errEl.textContent = getTranslation('progress-update-error');
        showNotification(getTranslation('progress-update-error'), 'error');
    } finally {
        hideLoading();
    }
}

// --- Flashcards ---
async function initFlashcards() {
    currentFlashcardCategory = document.getElementById('flashcard-category')?.value || 'sao';

    // Initialize knownFlashcards as an empty object if it doesn't exist
    if (!knownFlashcards) {
        knownFlashcards = {};
    }

    // Make sure the category exists in knownFlashcards
    if (!knownFlashcards[currentFlashcardCategory]) {
        knownFlashcards[currentFlashcardCategory] = [];
    }

    // Load known flashcards from localStorage if available
    if (currentUser) {
        try {
            const savedKnownCards = localStorage.getItem(`known_flashcards_${currentUser._id}`);
            if (savedKnownCards) {
                knownFlashcards = JSON.parse(savedKnownCards);

                // Ensure the current category exists
                if (!knownFlashcards[currentFlashcardCategory]) {
                    knownFlashcards[currentFlashcardCategory] = [];
                }
            }
        } catch (err) {
            console.error('Error loading known flashcards:', err);
            knownFlashcards = {};
            knownFlashcards[currentFlashcardCategory] = [];
        }
    }

    await fetchFlashcards(currentFlashcardCategory);
}
async function fetchFlashcards(cat) {
    console.log(`Fetch FC: ${cat}`);
    renderFlashcardUI(null, 0, true);

    // Sử dụng dữ liệu từ file flashcards.js
    if (window.flashcardsData && window.flashcardsData[cat]) {
        console.log(`Using local flashcard data for ${cat}`);
        currentFlashcardCategory = cat;
        currentCardIndex = 0;
        renderFlashcardUI(window.flashcardsData[cat], 0);
        return;
    }

    // Fallback to API if local data not available
    if (!currentUser) {
        renderFlashcardUI();
        return;
    }

    try {
        const r = await apiFetch(`/api/flashcards?category=${cat}`);
        const cards = await r.json();
        appFlashcardsData[cat] = Array.isArray(cards) ? cards.map(c => ({ id: c._id, front: c.question, back: c.answer })) : [];
        currentFlashcardCategory = cat;
        currentCardIndex = 0;
        renderFlashcardUI(appFlashcardsData[cat], 0);
    } catch (err) {
        console.error("Fetch FC err:", err);
        if (err.message !== getTranslation('session-expired')) showNotification(getTranslation('fetch-flashcards-error'), 'error');
        renderFlashcardUI();
    }
}
function renderFlashcardUI(cards=null, idx=0, loading=false) {
    /* Get all UI elements */
    const els = {
        c: document.getElementById('flashcard'),
        f: document.querySelector('#flashcard .flashcard-front .flashcard-content'),
        b: document.querySelector('#flashcard .flashcard-back .flashcard-content'),
        pt: document.getElementById('flashcard-progress-text'),
        pp: document.getElementById('flashcard-progress-percentage'),
        sc: document.getElementById('flashcard-score'),
        pv: document.getElementById('prev-card'),
        nx: document.getElementById('next-card'),
        tst: document.getElementById('test-flashcard'),
        rnd: document.getElementById('random-test-btn'),
        sv: document.getElementById('save-progress-btn'),
        sel: document.getElementById('flashcard-category'),
        mk: document.getElementById('mark-known'),
        ci: document.getElementById('flashcard-category-indicator'),
        ni: document.getElementById('flashcard-number-indicator'),
        pb: document.getElementById('flashcard-progress-bar'),
        sf: document.getElementById('shuffle-cards')
    };

    if (!Object.values(els).every(Boolean)) {
        console.error("FC UI missing!");
        return;
    }

    document.getElementById('flashcard')?.classList.remove('flipped');
    const dis = (d) => [els.pv, els.nx, els.tst, els.rnd, els.sv, els.sel, els.mk, els.sf].forEach(b => b.disabled = d);

    if (loading) {
        els.f.innerHTML = `<p class="loading-message">${getTranslation('loading-flashcards')}</p>`;
        els.b.innerHTML = '';
        els.pt.textContent = '- / -';
        els.pp.textContent = '-%';
        els.ci.textContent = currentFlashcardCategory;
        els.ni.textContent = '-/-';
        if (els.pb) els.pb.style.width = '0%';
        dis(true);
        return;
    }

    if (!currentUser) {
        els.f.innerHTML = `<p class="placeholder">${getTranslation('please-login-flashcard')}</p>`;
        els.b.innerHTML = '';
        els.pt.textContent = '0 / 0';
        els.pp.textContent = '0%';
        els.sc.textContent = '0';
        els.ci.textContent = currentFlashcardCategory;
        els.ni.textContent = '0/0';
        if (els.pb) els.pb.style.width = '0%';
        dis(true);
        return;
    }

    dis(false);

    // Sử dụng dữ liệu từ cards hoặc từ window.flashcardsData hoặc từ appFlashcardsData
    let set = [];

    if (cards) {
        set = cards;
    } else if (window.flashcardsData && window.flashcardsData[currentFlashcardCategory]) {
        set = window.flashcardsData[currentFlashcardCategory];
    } else if (appFlashcardsData && appFlashcardsData[currentFlashcardCategory]) {
        set = appFlashcardsData[currentFlashcardCategory];
    }

    const total = set.length;
    els.ci.textContent = getTranslation(currentFlashcardCategory) || currentFlashcardCategory;

    if (total === 0) {
        els.f.innerHTML = `<p class="placeholder">${getTranslation('no-flashcards-category')}</p>`;
        els.b.innerHTML = '';
        els.pt.textContent = '0 / 0';
        els.pp.textContent = '0%';
        els.ni.textContent = '0/0';
        if (els.pb) els.pb.style.width = '0%';
        els.pv.disabled = true;
        els.nx.disabled = true;
        els.tst.disabled = true;
        els.mk.disabled = true;
    } else {
        const cur = set[idx];
        if (cur) {
            els.f.innerHTML = `<p>${cur.front || 'Undefined content'}</p>`;
            els.b.innerHTML = `<p>${cur.back || 'Undefined content'}</p>`;
            els.pt.textContent = `${idx + 1} / ${total}`;
            els.ni.textContent = `${idx + 1}/${total}`;
            const perc = Math.round(((idx + 1) / total) * 100);
            els.pp.textContent = `${perc}%`;
            if (els.pb) els.pb.style.width = `${perc}%`;
            els.pv.disabled = idx === 0;
            els.nx.disabled = idx >= total - 1;
            els.tst.disabled = false;

            // Update the mark-known button state
            const cardId = cur.id || `${currentFlashcardCategory}-${idx}`;

            // Initialize knownFlashcards if it doesn't exist
            if (!knownFlashcards) {
                knownFlashcards = {};
            }

            // Initialize the category array if it doesn't exist
            if (!knownFlashcards[currentFlashcardCategory]) {
                knownFlashcards[currentFlashcardCategory] = [];
            }

            const isKnown = knownFlashcards[currentFlashcardCategory].includes(cardId);
            els.mk.classList.toggle('known', isKnown);
            els.mk.innerHTML = isKnown ?
                `<i class="fas fa-check-circle"></i> <span data-translate="marked-known">Đã biết</span>` :
                `<i class="fas fa-check"></i> <span data-translate="mark-known">Đánh dấu đã biết</span>`;
        } else {
            console.error('Current card is undefined at index', idx);
            els.f.innerHTML = `<p class="error">Error: Card data missing</p>`;
            els.b.innerHTML = `<p class="error">Error: Card data missing</p>`;
            els.ni.textContent = '?/?';
            if (els.pb) els.pb.style.width = '0%';
        }
    }

    els.sc.textContent = currentUser?.flashcardScore || 0;
}
function flipFlashcard() {
    // Get the flashcard element
    const flashcard = document.getElementById('flashcard');
    if (!flashcard) return;

    // Toggle the flipped class
    flashcard.classList.toggle('flipped');

    // Add animation
    if (window.anime) {
        if (!flashcard.classList.contains('flipped')) {
            // Animation for flipping to front
            anime({
                targets: flashcard,
                rotateY: [180, 0],
                duration: 800,
                easing: 'easeOutElastic(1, .6)',
                complete: function() {
                    // Ensure the card is fully reset
                    flashcard.style.transform = '';
                }
            });
        } else {
            // Animation for flipping to back
            anime({
                targets: flashcard,
                rotateY: [0, 180],
                duration: 800,
                easing: 'easeOutElastic(1, .6)',
                complete: function() {
                    // Ensure the card is fully flipped
                    flashcard.style.transform = 'rotateY(180deg)';
                }
            });
        }
    }
}
// Function to animate card transitions
function animateCardTransition(direction) {
    const flashcard = document.getElementById('flashcard');
    if (!flashcard || !window.anime) return;

    // First, slide out the current card
    anime({
        targets: flashcard,
        translateX: direction === 'next' ? [0, -50] : [0, 50],
        opacity: [1, 0],
        scale: [1, 0.9],
        duration: 300,
        easing: 'easeOutQuad',
        complete: function() {
            // Then, slide in the new card
            anime({
                targets: flashcard,
                translateX: direction === 'next' ? [50, 0] : [-50, 0],
                opacity: [0, 1],
                scale: [0.9, 1],
                duration: 400,
                easing: 'easeOutQuad'
            });
        }
    });
}

function nextFlashcard() {
    // Initialize knownFlashcards if it doesn't exist
    if (!knownFlashcards) {
        knownFlashcards = {};
    }

    // Initialize the category array if it doesn't exist
    if (!knownFlashcards[currentFlashcardCategory]) {
        knownFlashcards[currentFlashcardCategory] = [];
    }

    // Sử dụng dữ liệu từ window.flashcardsData hoặc từ appFlashcardsData
    const s = (window.flashcardsData && window.flashcardsData[currentFlashcardCategory]) ||
              appFlashcardsData[currentFlashcardCategory] ||
              [];

    if (currentCardIndex < s.length - 1) {
        // Make sure to remove the flipped class before changing cards
        document.getElementById('flashcard')?.classList.remove('flipped');
        currentCardIndex++;
        renderFlashcardUI(s, currentCardIndex);
        animateCardTransition('next');
    }
}
function prevFlashcard() {
    // Initialize knownFlashcards if it doesn't exist
    if (!knownFlashcards) {
        knownFlashcards = {};
    }

    // Initialize the category array if it doesn't exist
    if (!knownFlashcards[currentFlashcardCategory]) {
        knownFlashcards[currentFlashcardCategory] = [];
    }

    // Sử dụng dữ liệu từ window.flashcardsData hoặc từ appFlashcardsData
    const s = (window.flashcardsData && window.flashcardsData[currentFlashcardCategory]) ||
              appFlashcardsData[currentFlashcardCategory] ||
              [];

    if (currentCardIndex > 0) {
        // Make sure to remove the flipped class before changing cards
        document.getElementById('flashcard')?.classList.remove('flipped');
        currentCardIndex--;
        renderFlashcardUI(s, currentCardIndex);
        animateCardTransition('prev');
    }
}
// Function to handle flashcard keyboard navigation
function handleFlashcardKeyboard(e) {
    if (currentSection !== 'flashcards') return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextFlashcard();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevFlashcard();
    } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flipFlashcard();
    }
}

// Function to toggle the known status of the current flashcard
function toggleCardKnownStatus() {
    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        return;
    }

    // Get the current card set
    const set = (window.flashcardsData && window.flashcardsData[currentFlashcardCategory]) ||
              appFlashcardsData[currentFlashcardCategory] ||
              [];

    if (set.length === 0 || currentCardIndex >= set.length) {
        return;
    }

    const card = set[currentCardIndex];
    const cardId = card.id || `${currentFlashcardCategory}-${currentCardIndex}`;

    // Initialize knownFlashcards if it doesn't exist
    if (!knownFlashcards) {
        knownFlashcards = {};
    }

    // Initialize the category array if it doesn't exist
    if (!knownFlashcards[currentFlashcardCategory]) {
        knownFlashcards[currentFlashcardCategory] = [];
    }

    // Toggle the known status
    const isKnown = knownFlashcards[currentFlashcardCategory].includes(cardId);

    if (isKnown) {
        // Remove from known cards
        knownFlashcards[currentFlashcardCategory] = knownFlashcards[currentFlashcardCategory].filter(id => id !== cardId);
        showNotification(getTranslation('card-marked-unknown'), 'info');
    } else {
        // Add to known cards
        knownFlashcards[currentFlashcardCategory].push(cardId);
        showNotification(getTranslation('card-marked-known'), 'success');
    }

    // Save to localStorage
    if (currentUser) {
        localStorage.setItem(`known_flashcards_${currentUser._id}`, JSON.stringify(knownFlashcards));
    }

    // Update the UI
    renderFlashcardUI(set, currentCardIndex);
}

// Function to shuffle the current flashcard deck
function shuffleFlashcards() {
    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        return;
    }

    // Initialize knownFlashcards if it doesn't exist
    if (!knownFlashcards) {
        knownFlashcards = {};
    }

    // Initialize the category array if it doesn't exist
    if (!knownFlashcards[currentFlashcardCategory]) {
        knownFlashcards[currentFlashcardCategory] = [];
    }

    // Get the current card set
    let set = (window.flashcardsData && window.flashcardsData[currentFlashcardCategory]) ||
              appFlashcardsData[currentFlashcardCategory] ||
              [];

    if (set.length <= 1) {
        showNotification(getTranslation('not-enough-cards-to-shuffle'), 'info');
        return;
    }

    // Create a copy of the array to shuffle
    set = [...set];

    // Fisher-Yates shuffle algorithm
    for (let i = set.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [set[i], set[j]] = [set[j], set[i]];
    }

    // Update the data source
    if (window.flashcardsData && window.flashcardsData[currentFlashcardCategory]) {
        window.flashcardsData[currentFlashcardCategory] = set;
    } else {
        appFlashcardsData[currentFlashcardCategory] = set;
    }

    // Reset to the first card and update UI
    currentCardIndex = 0;
    renderFlashcardUI(set, currentCardIndex);
    showNotification(getTranslation('cards-shuffled'), 'success');
}
function handleFlashcardCategoryChange(e) {
    if (e.target.value !== currentFlashcardCategory) {
        const category = e.target.value;
        currentFlashcardCategory = category;
        currentCardIndex = 0;

        // Initialize knownFlashcards if it doesn't exist
        if (!knownFlashcards) {
            knownFlashcards = {};
        }

        // Initialize the category array if it doesn't exist
        if (!knownFlashcards[currentFlashcardCategory]) {
            knownFlashcards[currentFlashcardCategory] = [];
        }

        // Make sure to remove the flipped class when changing categories
        document.getElementById('flashcard')?.classList.remove('flipped');

        // Load user progress if available
        if (currentUser && currentUser.flashcardProgress && currentUser.flashcardProgress[category]) {
            currentCardIndex = currentUser.flashcardProgress[category].currentCardIndex || 0;
        }

        // Sử dụng dữ liệu từ window.flashcardsData hoặc từ appFlashcardsData
        const cards = (window.flashcardsData && window.flashcardsData[category]) ||
                      appFlashcardsData[category] ||
                      [];

        if (cards && cards.length > 0) {
            renderFlashcardUI(cards, currentCardIndex);
        } else {
            fetchFlashcards(category);
        }
    }
}
async function saveFlashcardProgress() {
    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        return;
    }

    // Initialize knownFlashcards if it doesn't exist
    if (!knownFlashcards) {
        knownFlashcards = {};
    }

    // Initialize the category array if it doesn't exist
    if (!knownFlashcards[currentFlashcardCategory]) {
        knownFlashcards[currentFlashcardCategory] = [];
    }

    const cat = currentFlashcardCategory;
    const cards = (window.flashcardsData && window.flashcardsData[cat]) || appFlashcardsData[cat];

    if (!cards || cards.length === 0) {
        showNotification(getTranslation('no-progress-to-save'), 'info');
        return;
    }

    const payload = { currentCardIndex };
    showLoading();

    try {
        const r = await apiFetch('/api/flashcards/progress', {
            method: 'POST',
            body: JSON.stringify({ category: cat, progressData: payload })
        });

        const d = await r.json();
        if (d.flashcardProgress) currentUser.flashcardProgress = d.flashcardProgress;
        showNotification(getTranslation('flashcard-progress-saved'), 'success');
    } catch (err) {
        console.error("Save FC prog error:", err);
        if (err.message !== getTranslation('session-expired'))
            showNotification(err.message || getTranslation('flashcard-progress-error'), 'error');
    } finally {
        hideLoading();
    }
}
function openFlashcardTestModal(random=false) {
    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        openAuthModal(true);
        return;
    }

    const modal = document.getElementById('flashcard-test-modal');
    const content = document.getElementById('flashcard-test-content');
    const result = document.getElementById('test-result');
    const btn = modal?.querySelector('#submit-test');

    if (!modal || !content || !result || !btn) return;

    result.innerHTML = '';
    content.innerHTML = `<p class="loading-message">${getTranslation('loading-test')}</p>`;
    animateModalOpen(modal);

    let set = [];
    // Sử dụng dữ liệu từ window.flashcardsData hoặc từ appFlashcardsData
    const curSet = (window.flashcardsData && window.flashcardsData[currentFlashcardCategory]) ||
                  appFlashcardsData[currentFlashcardCategory] ||
                  [];

    if (random) {
        // Collect all flashcards from all categories
        let allCards = [];

        // Add cards from window.flashcardsData if available
        if (window.flashcardsData) {
            Object.values(window.flashcardsData).forEach(cards => {
                if (Array.isArray(cards)) allCards = [...allCards, ...cards];
            });
        }

        // Add cards from appFlashcardsData
        Object.values(appFlashcardsData).forEach(cards => {
            if (Array.isArray(cards)) allCards = [...allCards, ...cards];
        });

        if (allCards.length === 0) {
            content.innerHTML = `<p class="placeholder">${getTranslation('no-flashcards-available')}</p>`;
            btn.style.display = 'none';
            return;
        }

        set = allCards.sort(() => 0.5 - Math.random()).slice(0, 10);
    } else {
        if (curSet.length === 0) {
            content.innerHTML = `<p class="placeholder">${getTranslation('no-flashcards-category')}</p>`;
            btn.style.display = 'none';
            return;
        }
        set = [...curSet];
    }

    modal.dataset.testSet = JSON.stringify(set.map(c => ({ id: c.id, front: c.front, back: c.back })));
    content.innerHTML = '';

    set.forEach((c, i) => {
        const d = document.createElement('div');
        d.className = 'flashcard-test-item';
        d.dataset.cardId = c.id;
        d.innerHTML = `<label for="ti-${i}">${i+1}. ${c.front}</label><input type="text" id="ti-${i}" class="flashcard-test-input input-field" placeholder="${getTranslation('enter-answer')}">`;
        content.appendChild(d);
    });

    btn.style.display = 'block';
    btn.disabled = false;
}
function closeFlashcardTestModal(){animateModalClose(document.getElementById('flashcard-test-modal'));}
async function submitFlashcardTest(){const modal=document.getElementById('flashcard-test-modal');if(!modal||!currentUser)return;const set=JSON.parse(modal.dataset.testSet||'[]');if(set.length===0)return;const content=document.getElementById('flashcard-test-content');const inputs=content.querySelectorAll('.flashcard-test-input');const resultArea=document.getElementById('test-result');const btn=modal.querySelector('#submit-test');let score=0;let html=`<h4>${getTranslation('results')}:</h4><ul>`;inputs.forEach((inp,i)=>{const userAns=inp.value.trim().toLowerCase();const correctAns=set[i].back.trim().toLowerCase();const correct=userAns===correctAns;html+=`<li class="${correct?'correct':'incorrect'}">${i+1}. ${correct?getTranslation('correct'):`${getTranslation('incorrect')} (${getTranslation('answer')}: ${set[i].back})`}</li>`;if(correct)score++;inp.disabled=true;inp.classList.add(correct?'correct':'incorrect');});html+=`</ul><p><strong>${getTranslation('score')}: ${score} / ${set.length}</strong></p>`;resultArea.innerHTML=html;if(btn)btn.style.display='none';const ptsEarned=score*2;if(ptsEarned>0){try{await updateUserProgressAndPoints(ptsEarned,5,`Flashcard Test (${currentFlashcardCategory})`);}catch(err){console.error("Err updating points post-test:",err);if(err.message!==getTranslation('session-expired'))showNotification(err.message||getTranslation('flashcard-test-error'),'error');}}else showNotification(getTranslation('test-completed'),'info');}

// --- Challenges ---
async function initChallenges() { await fetchDailyChallenge(); }
async function fetchDailyChallenge() { console.log("Fetching challenge..."); const grid=document.getElementById('challenge-grid');const form=document.getElementById('challenge-submission'); if(grid)grid.innerHTML=`<p class="loading-message">${getTranslation('loading-challenge')}</p>`;if(form)form.style.display='none'; if(!currentUser){renderChallenge(null);return;} try{const r=await apiFetch('/api/challenges/daily'); currentDailyChallenge=await r.json(); renderChallenge(currentDailyChallenge);}catch(err){console.error('Fetch challenge err:',err);currentDailyChallenge=null;renderChallenge(null,'challenge-fetch-error');if(err.message!==getTranslation('session-expired'))showNotification(getTranslation('challenge-fetch-error'),'error');}}
function renderChallenge(chal, errKey = null) { const grid=document.getElementById('challenge-grid');const form=document.getElementById('challenge-submission');if(!grid||!form)return;grid.innerHTML='';if(errKey){grid.innerHTML=`<p class="placeholder error">${getTranslation(errKey)}</p>`;form.style.display='none';return;}if(!currentUser){grid.innerHTML=`<p class="placeholder">${getTranslation('please-login-challenge')}</p>`;form.style.display='none';return;}if(!chal||!chal._id){grid.innerHTML=`<p class="placeholder">${getTranslation('no-challenge-today')}</p>`;form.style.display='none';return;}const submitted=currentUser.submittedChallenges?.includes(chal._id);const card=createChallengeCard(chal,submitted);grid.appendChild(card);if(anime&&!card.dataset.animated){anime({targets:card,opacity:[0,1],translateY:[20,0],duration:500,easing:'easeOutQuad'});card.dataset.animated=true;}if(!submitted&&chal._id!=='default_daily_001'){form.style.display='block';resetChallengeForm();}else{form.style.display='none';}}
function createChallengeCard(c, submitted) { const card=document.createElement('div');card.className=`content-card challenge-item ${submitted?'submitted':''}`;card.dataset.challengeId=c._id;card.innerHTML=`<div class="thumbnail" style="background-image: url('${getFullAssetUrl(c.thumbnail)}');"></div><h3>${c.title||'Challenge'}</h3><p>${c.description||''}</p><div class="challenge-details"><span><i class="fas fa-star"></i> ${getTranslation('points')}: ${c.points||'N/A'}</span>${c.type?`<span><i class="fas fa-tasks"></i> ${getTranslation('type')}: ${c.type}</span>`:''}</div>${submitted?`<p class="submitted-message"><i class="fas fa-check"></i> ${getTranslation('challenge-submitted-message')}</p>`:''}`;return card;}
async function handleChallengeSubmit(e){e.preventDefault();if(!currentUser||!currentDailyChallenge)return;const form=document.getElementById('challenge-submission-form');const fileIn=document.getElementById('challenge-file');const noteIn=document.getElementById('challenge-note');const btn=form?.querySelector('button[type="submit"]');const file=fileIn.files[0];const note=noteIn.value.trim();if(!file){showNotification(getTranslation('select-submission-file'),'error');return;}const ext=file.name.split('.').pop().toLowerCase();if(!ALLOWED_SUBMISSION_EXTENSIONS.includes(ext)){showNotification(getTranslation('invalid-submission-type'),'error');return;}if(file.size>MAX_SUBMISSION_SIZE_MB*1024*1024){showNotification(getTranslation('submission-too-large'),'error');return;}const fd=new FormData();fd.append('file',file);fd.append('note',note);fd.append('type','challenge');fd.append('relatedId',currentDailyChallenge._id);fd.append('challengePoints',currentDailyChallenge.points||0);fd.append('relatedTitle',currentDailyChallenge.title||'Daily Challenge');showLoading();if(btn)btn.disabled=true;try{const response = await apiFetch('/api/submissions',{method:'POST',body:fd});if(response.status === 400){const data = await response.json();showNotification(data.message,'error');return;}if(!currentUser.submittedChallenges)currentUser.submittedChallenges=[];currentUser.submittedChallenges.push(currentDailyChallenge._id); // Update local state immediately
        // Update user on backend to include submitted challenge ID
        await apiFetch(`/api/users/${currentUser._id}`, { method: 'PUT', body: JSON.stringify({ submittedChallenges: currentUser.submittedChallenges }) });
        showNotification(getTranslation('challenge-submitted'),'success');renderChallenge(currentDailyChallenge);}catch(err){console.error("Challenge submit err:",err);if(err.message!==getTranslation('session-expired'))showNotification(err.message||getTranslation('submission-error'),'error');if(btn)btn.disabled=false;}finally{hideLoading();}}
function resetChallengeForm(){const form=document.getElementById('challenge-submission-form');if(!form)return;const btn=form.querySelector('button[type="submit"]');const file=form.querySelector('input[type="file"]');const note=form.querySelector('textarea');const fname=document.getElementById('challenge-file-name');form.reset();if(btn)btn.disabled=false;if(file)file.disabled=false;if(note)note.disabled=false;if(fname)fname.textContent=getTranslation('no-file-chosen');}
function displaySelectedFileName(){const fileIn=document.getElementById('challenge-file');const disp=document.getElementById('challenge-file-name');if(!disp||!fileIn)return;disp.textContent=fileIn.files.length>0?fileIn.files[0].name:getTranslation('no-file-chosen');}

// --- Mini-Games ---
// Function to play sound effects
function playSound(type) {
    // Check if sound effects are available
    const soundEffectsAvailable = false; // Set to true when you have sound effect files

    if (!soundEffectsAvailable) {
        // Skip playing sounds if they're not available to prevent 404 errors
        return;
    }

    const soundMap = {
        'success': '/assets/audio/effects/success.mp3',
        'error': '/assets/audio/effects/error.mp3',
        'click': '/assets/audio/effects/click.mp3',
        'hover': '/assets/audio/effects/hover.mp3',
        'popup': '/assets/audio/effects/popup.mp3',
        'close': '/assets/audio/effects/close.mp3',
        'level-complete': '/assets/audio/effects/level-complete.mp3',
        'button': '/assets/audio/effects/button.mp3'
    };

    const soundUrl = soundMap[type];
    if (!soundUrl) return;

    const audio = new Audio(soundUrl);

    // Set appropriate volume based on sound type
    switch(type) {
        case 'success':
        case 'level-complete':
            audio.volume = 0.6;
            break;
        case 'error':
            audio.volume = 0.4;
            break;
        case 'hover':
        case 'click':
            audio.volume = 0.3;
            break;
        case 'popup':
        case 'close':
            audio.volume = 0.4;
            break;
        default:
            audio.volume = 0.5;
    }

    // Add error handling to prevent console errors
    audio.addEventListener('error', () => {
        console.log(`Sound file not found: ${soundUrl}`);
    });

    audio.play().catch(err => {
        // Silently handle the error to prevent console spam
        if (err.name !== 'NotSupportedError' && err.name !== 'NotFoundError') {
            console.error('Error playing sound:', err);
        }
    });
}

function renderMiniGameSelection(){
    const grid = document.getElementById('mini-game-grid');
    if (!grid) return;

    // Set avatar backgrounds for mini-game cards
    const avatars = grid.querySelectorAll('.mini-game-avatar');
    avatars.forEach(avatar => {
        const gameType = avatar.dataset.gameType;
        if (gameType) {
            const avatarUrl = getMiniGameAvatar(gameType);
            avatar.style.backgroundImage = `url('${avatarUrl}')`;
        }
    });

    // Đánh dấu các nút cấp độ để thêm event listener
    const difficultyBtns = grid.querySelectorAll('.difficulty-btn:not([data-listener="true"])');
    if (difficultyBtns.length > 0) {
        console.log('Adding event listeners to difficulty buttons in mini-game section');
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                console.log('Direct difficulty button click (from renderMiniGameSelection):', this.dataset.gameType, this.dataset.level);
                e.stopPropagation();
                e.preventDefault();

                if (!currentUser) {
                    showNotification(getTranslation('please-login-game'), 'error');
                    openAuthModal(true);
                    return;
                }

                // Play click sound
                playSound('click');

                const gameType = this.dataset.gameType;
                const level = this.dataset.level;
                startMiniGame(gameType, level);
            });
            btn.dataset.listener = 'true'; // Đánh dấu đã có listener
        });
    }

    const cards = grid.querySelectorAll('.mini-game-card');
    if (anime && cards.length > 0) {
        cards.forEach(c => {
            if (!c.dataset.animated) c.style.opacity = '0';
        });
        anime({
            targets: cards,
            translateY: [40, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            easing: 'easeOutExpo'
        });
        cards.forEach(c => c.dataset.animated = 'true');
    }
}

function handleMiniGameCardClick(e) {
    console.log('Mini-game click detected', e.target);

    // Check if the click was on a difficulty button or its children
    const difficultyBtn = e.target.closest('.difficulty-btn');
    if (difficultyBtn) {
        console.log('Difficulty button clicked:', difficultyBtn.dataset.gameType, difficultyBtn.dataset.level);
        e.stopPropagation(); // Prevent the card click event
        e.preventDefault(); // Prevent default behavior

        if (!currentUser) {
            showNotification(getTranslation('please-login-game'), 'error');
            openAuthModal(true);
            return;
        }

        const gameType = difficultyBtn.dataset.gameType;
        const level = difficultyBtn.dataset.level;
        console.log('Starting mini-game with type:', gameType, 'and level:', level);
        startMiniGame(gameType, level);
        return;
    }

    // Handle regular card click (for non-difficulty cards)
    const card = e.target.closest('.mini-game-card[data-game-type]');
    if (!card) return;

    console.log('Mini-game card clicked:', card.dataset.gameType);

    // If it's a card with difficulty levels, don't do anything (let user click the buttons)
    if (card.querySelector('.game-difficulty-levels')) {
        console.log('Card has difficulty levels, ignoring click on card itself');
        return;
    }

    if (!currentUser) {
        showNotification(getTranslation('please-login-game'), 'error');
        openAuthModal(true);
        return;
    }

    startMiniGame(card.dataset.gameType);
}

async function startMiniGame(type, level) {
    console.log(`Starting game: ${type}, Level: ${level || 'default'}`);
    showLoading();
    try {
        let url = `/api/mini-game/start?type=${type}`;
        if (level) {
            url += `&level=${level}`;
        }
        console.log('Fetching mini-game data from URL:', url);

        const r = await apiFetch(url);
        console.log('API response status:', r.status);

        currentMiniGame = await r.json();
        console.log('Mini-game data received:', currentMiniGame);

        currentMiniGame.level = level || 1; // Store the level

        // Play popup sound effect
        playSound('popup');

        // Open the modal
        const modal = document.getElementById('mini-game-modal');
        if (modal) {
            animateModalOpen(modal);
            renderMiniGame(currentMiniGame);

            // Make sure the submit button is visible and has the correct handler
            const btn = document.getElementById('game-submit-btn');
            if (btn) {
                btn.style.display = 'block';
                btn.disabled = false;
                btn.textContent = getTranslation('submit-test');
                btn.onclick = submitMiniGameAnswer;

                // Add hover sound effect to the submit button
                btn.addEventListener('mouseenter', () => playSound('hover'));
                btn.addEventListener('click', () => playSound('button'));
            }

            // Add hover sound effect to the close button
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('mouseenter', () => playSound('hover'));
            }
        } else {
            console.error('Mini-game modal not found');
        }
    } catch (err) {
        console.error(`Start game ${type} err:`, err);
        if (err.message !== getTranslation('session-expired'))
            showNotification(err.message || getTranslation('game-start-error'), 'error');
    } finally {
        hideLoading();
    }
}
function openMiniGameModal(data) {
    const m = document.getElementById('mini-game-modal');
    if (!m) return;

    const title = m.querySelector('#mini-game-title');
    const levelIndicator = m.querySelector('#game-level-indicator');
    const levelValue = levelIndicator?.querySelector('.level-value');
    const imgCont = m.querySelector('#game-image-container');
    const img = m.querySelector('#game-image');
    const audioCont = m.querySelector('#game-audio-container');
    const audio = m.querySelector('#game-audio');
    const audioSource = m.querySelector('#game-audio-source');
    const playBtn = m.querySelector('#play-audio');
    const progressBar = m.querySelector('#audio-progress-bar');
    const audioTime = m.querySelector('#audio-time');
    const q = m.querySelector('#game-question');
    const textAnswerCont = m.querySelector('#text-answer-container');
    const ans = m.querySelector('#game-answer');
    const multipleChoiceCont = m.querySelector('#multiple-choice-container');
    const multipleChoiceGrid = m.querySelector('#multiple-choice-grid');
    const fb = m.querySelector('#game-feedback');
    const btn = m.querySelector('#game-submit-btn');

    if (!title || !imgCont || !img || !audioCont || !audio || !audioSource || !playBtn || !q || !ans || !fb || !btn) {
        console.error("Mini-game modal elements missing!");
        return;
    }

    // Reset form elements
    ans.value = '';
    ans.disabled = false;
    ans.classList.remove('correct', 'incorrect');
    fb.innerHTML = '';
    fb.className = 'feedback-area';
    btn.disabled = false;
    btn.textContent = getTranslation('submit-test');
    btn.style.display = 'block'; // Always show the submit button

    // Reset multiple choice grid if it exists
    if (multipleChoiceGrid) {
        multipleChoiceGrid.querySelectorAll('.choice-option').forEach(opt => {
            opt.classList.remove('selected', 'correct', 'incorrect', 'disabled', 'pulse-animation');
            opt.style.pointerEvents = 'auto';
        });
    }

    // Set level indicator
    if (levelValue && data.level) {
        levelValue.textContent = data.level;
        levelIndicator.style.display = 'flex';
    } else if (levelIndicator) {
        levelIndicator.style.display = 'none';
    }

    // Set title and question
    title.textContent = getTranslation(data.gameType) || 'Mini-Game';
    q.textContent = data.question;

    // Handle image if available
    if (data.imageUrl) {
        img.src = getFullAssetUrl(data.imageUrl);
        img.alt = `${getTranslation(data.gameType)} Image`;
        imgCont.style.display = 'block';
    } else {
        img.src = '';
        imgCont.style.display = 'none';
    }

    // Handle audio if available
    if (data.audioUrl) {
        audioSource.src = getFullAssetUrl(data.audioUrl);
        audio.load(); // Important: reload the audio element after changing source
        audioCont.style.display = 'block';

        // Set up audio player controls
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (progressBar) progressBar.style.width = '0%';
        if (audioTime) audioTime.textContent = '0:00';

        // Add event listeners for audio player
        audio.addEventListener('timeupdate', function() {
            if (progressBar) {
                const percent = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${percent}%`;
            }
            if (audioTime) {
                const minutes = Math.floor(audio.currentTime / 60);
                const seconds = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
                audioTime.textContent = `${minutes}:${seconds}`;
            }
        });

        audio.addEventListener('ended', function() {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        });

        // Add event listener to play button
        playBtn.onclick = function() {
            if (audio.paused) {
                audio.play();
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                audio.pause();
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        };
    } else {
        audioSource.src = '';
        audioCont.style.display = 'none';
    }

    // Handle multiple choice options for level 3
    if (data.level === 3 && data.options && multipleChoiceCont && multipleChoiceGrid) {
        // Show multiple choice container, hide text input
        multipleChoiceCont.style.display = 'block';
        textAnswerCont.style.display = 'none';

        // Clear previous options
        multipleChoiceGrid.innerHTML = '';

        // Add options
        data.options.forEach(option => {
            const optionEl = document.createElement('div');
            optionEl.className = 'choice-option';
            optionEl.dataset.value = option.label.toLowerCase();

            // Add image if available
            if (option.imageUrl) {
                const img = document.createElement('img');
                img.src = getFullAssetUrl(option.imageUrl);
                img.alt = option.label;
                optionEl.appendChild(img);
            }

            // Add label
            const label = document.createElement('div');
            label.className = 'option-label';
            label.textContent = option.label;
            optionEl.appendChild(label);

            // Add click handler
            optionEl.addEventListener('click', function() {
                // Remove selected class from all options
                multipleChoiceGrid.querySelectorAll('.choice-option').forEach(opt => {
                    opt.classList.remove('selected', 'correct', 'incorrect');
                });
                // Add selected class to clicked option
                this.classList.add('selected');
                console.log('Option clicked:', this.dataset.value); // Debug log

                // Auto-play audio when an option is selected
                if (audio && !audio.paused) {
                    audio.currentTime = 0;
                } else if (audio) {
                    audio.play()
                        .then(() => {
                            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        })
                        .catch(err => {
                            console.error('Error playing audio on option click:', err);
                        });
                }
            });

            multipleChoiceGrid.appendChild(optionEl);
        });

        // Hide image container for level 3 as we're showing images in the options
        imgCont.style.display = 'none';

        // Auto-play audio for level 3
        if (audio) {
            setTimeout(() => {
                audio.play()
                    .then(() => {
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    })
                    .catch(err => {
                        console.error('Error playing audio:', err);
                        // Try again after user interaction
                        playBtn.addEventListener('click', function playOnce() {
                            audio.play();
                            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                            playBtn.removeEventListener('click', playOnce);
                        }, { once: true });
                    });
            }, 500);
        }

        // Make sure the submit button is visible
        if (btn) {
            btn.style.display = 'block';
            btn.disabled = false;
        }
    } else {
        // Show text input, hide multiple choice
        if (textAnswerCont) textAnswerCont.style.display = 'block';
        if (multipleChoiceCont) multipleChoiceCont.style.display = 'none';
    }

    // Open modal and focus on answer input if using text input
    animateModalOpen(m);
    if (data.level !== 3 && data.level !== '3') {
        ans.focus();
    } else {
        // For level 3, make sure the submit button is visible and enabled
        if (btn) {
            btn.style.display = 'block';
            btn.disabled = false;
            btn.onclick = submitMiniGameAnswer; // Đảm bảo nút submit có hàm xử lý đúng
        }
    }
}
function closeMiniGameModal() {
    const modal = document.getElementById('mini-game-modal');
    const audio = modal?.querySelector('#game-audio');

    // Stop audio if playing
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    // Play close sound effect
    playSound('close');

    animateModalClose(modal);
    currentMiniGame = null;
}

// Reset the current mini-game to try again
function resetMiniGame() {
    console.log('Resetting mini-game');
    showLoading();

    try {
        // Reset UI elements
        const m = document.getElementById('mini-game-modal');
        const multipleChoiceCont = m?.querySelector('#multiple-choice-container');
        const multipleChoiceGrid = m?.querySelector('#multiple-choice-grid');
        const ans = m?.querySelector('#game-answer');
        const fb = m?.querySelector('#game-feedback');
        const btn = m?.querySelector('#game-submit-btn');
        const audio = m?.querySelector('#game-audio');

        // Clear feedback area
        if (fb) {
            fb.innerHTML = '';
            fb.className = 'feedback-area';
        }

        // Reset text input if it exists
        if (ans) {
            ans.value = '';
            ans.disabled = false;
            ans.classList.remove('correct', 'incorrect');
        }

        // Reset multiple choice options if they exist
        if (multipleChoiceGrid) {
            multipleChoiceGrid.querySelectorAll('.choice-option').forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect', 'disabled', 'pulse-animation');
                opt.style.pointerEvents = 'auto';
            });
        }

        // Reset button
        if (btn) {
            btn.disabled = false;
            btn.textContent = getTranslation('submit-test');
            btn.classList.remove('next-question-btn', 'retry-btn');
            btn.onclick = submitMiniGameAnswer;
        }

        // Reset audio if it exists
        if (audio) {
            audio.pause();
            audio.currentTime = 0;

            // Auto-play for level 3
            if ((currentMiniGame.level === 3 || currentMiniGame.level === '3') && currentMiniGame.audioUrl) {
                const playBtn = m?.querySelector('#play-audio');
                setTimeout(() => {
                    audio.play()
                        .then(() => {
                            if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        })
                        .catch(err => {
                            console.error('Error auto-playing audio after reset:', err);
                        });
                }, 500);
            }
        }

        // Show notification
        showNotification(getTranslation('game-reset'), 'info');
    } catch (err) {
        console.error('Reset mini-game error:', err);
        showNotification(getTranslation('game-reset-error'), 'error');
    } finally {
        hideLoading();
    }
}

async function loadNextMiniGameQuestion() {
    console.log('Loading next mini-game question');
    showLoading();

    try {
        // Lấy thông tin về game type và level từ game hiện tại
        const currentGameType = currentMiniGame?.gameType;
        const currentLevel = currentMiniGame?.level;

        console.log(`Current game: ${currentGameType}, Level: ${currentLevel}`);

        // Kiểm tra xem có thông tin game hiện tại không
        if (!currentGameType || !currentLevel) {
            console.error('Missing current game information');
            showNotification(getTranslation('load-game-error'), 'error');
            hideLoading();
            return;
        }

        try {
            // Thử gọi API để lấy câu hỏi tiếp theo
            console.log('Attempting to fetch next question from API');
            const currentId = currentMiniGame?.gameId;
            let url = `/api/mini-game/next?type=${currentGameType}&level=${currentLevel}`;
            if (currentId) {
                url += `&currentId=${currentId}`;
            }
            console.log('Fetching next question from URL:', url);
            const r = await apiFetch(url);
            const data = await r.json();

            if (data && data.gameId) {
                console.log('Next question received from API:', data);
                currentMiniGame = data;

                // Đảm bảo level được giữ nguyên
                if (currentLevel && !data.level) {
                    currentMiniGame.level = currentLevel;
                }

                // Render câu hỏi mới
                renderMiniGame(currentMiniGame);

                // Đảm bảo nút submit được hiển thị và có handler đúng
                const btn = document.getElementById('game-submit-btn');
                if (btn) {
                    btn.style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = getTranslation('submit-test');
                    btn.onclick = submitMiniGameAnswer;
                }

                // Nếu là level 3, tự động phát audio nếu có
                if ((currentMiniGame.level === 3 || currentMiniGame.level === '3') && currentMiniGame.audioUrl) {
                    const audio = document.querySelector('#game-audio');
                    const playBtn = document.querySelector('#play-audio');

                    if (audio) {
                        setTimeout(() => {
                            audio.play()
                                .then(() => {
                                    if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                                })
                                .catch(err => {
                                    console.error('Error auto-playing audio for next question:', err);
                                });
                        }, 500);
                    }
                }

                // Show notification
                showNotification(getTranslation('next-question-loaded'), 'success');
                hideLoading();
                return;
            } else {
                console.log('API returned no data or invalid data');
                showNotification(getTranslation('load-game-error'), 'error');
                hideLoading();
                return;
            }
        } catch (apiErr) {
            console.error('API fetch error:', apiErr);
            showNotification(getTranslation('load-game-error'), 'error');
            hideLoading();
            return;
        }
    } catch (err) {
        console.error("Load next game err:", err);
        if (err.message !== getTranslation('session-expired')) {
            showNotification(getTranslation('load-game-error'), 'error');
        }
    } finally {
        hideLoading();
    }
}

// Hàm lấy danh sách câu hỏi dựa trên loại game
// Không còn sử dụng mock data nữa, tất cả đều lấy từ API
function getMockQuestionsForGameType(gameType) {
    console.warn('getMockQuestionsForGameType is deprecated - all data should come from API');
    return [];
}

function renderMiniGame(data) {
    const m = document.getElementById('mini-game-modal');
    if (!m) return;

    const title = m.querySelector('#mini-game-title');
    const levelIndicator = m.querySelector('#game-level-indicator');
    const levelValue = levelIndicator?.querySelector('.level-value');
    const imgCont = m.querySelector('#game-image-container');
    const img = m.querySelector('#game-image');
    const audioCont = m.querySelector('#game-audio-container');
    const audio = m.querySelector('#game-audio');
    const audioSource = m.querySelector('#game-audio-source');
    const playBtn = m.querySelector('#play-audio');
    const progressBar = m.querySelector('#audio-progress-bar');
    const audioTime = m.querySelector('#audio-time');
    const q = m.querySelector('#game-question');
    const textAnswerCont = m.querySelector('#text-answer-container');
    const ans = m.querySelector('#game-answer');
    const multipleChoiceCont = m.querySelector('#multiple-choice-container');
    const multipleChoiceGrid = m.querySelector('#multiple-choice-grid');
    const fb = m.querySelector('#game-feedback');
    const btn = m.querySelector('#game-submit-btn');

    if (!title || !imgCont || !img || !audioCont || !audio || !q || !ans || !fb || !btn) {
        console.error('Missing elements in mini-game modal');
        return;
    }

    // Reset UI
    if (ans) {
        ans.value = '';
        ans.disabled = false;
        ans.classList.remove('correct', 'incorrect');
    }
    if (fb) {
        fb.innerHTML = '';
        fb.className = 'feedback-area';
    }
    if (btn) {
        btn.disabled = false;
        btn.textContent = getTranslation('submit-test');
        btn.style.display = 'block';
        btn.onclick = submitMiniGameAnswer;
    }

    // Reset multiple choice grid if it exists
    if (multipleChoiceGrid) {
        multipleChoiceGrid.querySelectorAll('.choice-option').forEach(opt => {
            opt.classList.remove('selected', 'correct', 'incorrect', 'disabled', 'pulse-animation');
            opt.style.pointerEvents = 'auto';
        });
    }

    // Set level indicator
    if (levelValue && data.level) {
        levelValue.textContent = data.level;
        levelIndicator.style.display = 'flex';
    } else if (levelIndicator) {
        levelIndicator.style.display = 'none';
    }

    // Set title and question
    title.textContent = getTranslation(data.gameType) || 'Mini-Game';
    q.textContent = data.question;

    // Handle image if available
    if (data.imageUrl && data.level !== '3' && data.level !== 3) {
        img.src = getFullAssetUrl(data.imageUrl);
        img.alt = `${getTranslation(data.gameType)} Image`;
        imgCont.style.display = 'block';
    } else {
        img.src = '';
        imgCont.style.display = 'none';
    }

    // Handle audio if available
    if (data.audioUrl) {
        audioSource.src = getFullAssetUrl(data.audioUrl);
        audio.load(); // Important: reload the audio element after changing source
        audioCont.style.display = 'block';

        // Set up audio player controls
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (progressBar) progressBar.style.width = '0%';
        if (audioTime) audioTime.textContent = '0:00';

        // Add event listeners for audio player
        audio.addEventListener('timeupdate', function() {
            if (progressBar) {
                const percent = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${percent}%`;
            }
            if (audioTime) {
                const minutes = Math.floor(audio.currentTime / 60);
                const seconds = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
                audioTime.textContent = `${minutes}:${seconds}`;
            }
        });

        audio.addEventListener('ended', function() {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        });

        // Add event listener to play button
        playBtn.onclick = function() {
            if (audio.paused) {
                audio.play()
                    .then(() => {
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    })
                    .catch(err => {
                        console.error('Error playing audio:', err);
                    });
            } else {
                audio.pause();
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        };
    } else {
        audioCont.style.display = 'none';
    }

    // Handle multiple choice options for level 3
    if ((data.level === 3 || data.level === '3') && data.options && multipleChoiceCont && multipleChoiceGrid) {
        // Show multiple choice container, hide text input
        multipleChoiceCont.style.display = 'block';
        textAnswerCont.style.display = 'none';

        // Make sure the submit button is visible
        if (btn) {
            btn.style.display = 'block';
            btn.disabled = false;
            btn.onclick = submitMiniGameAnswer;
        }

        // Clear previous options
        multipleChoiceGrid.innerHTML = '';

        // Add options
        data.options.forEach(option => {
            const optionEl = document.createElement('div');
            optionEl.className = 'choice-option';
            optionEl.dataset.value = option.label.toLowerCase();

            // Add image if available
            if (option.imageUrl) {
                const img = document.createElement('img');
                img.src = getFullAssetUrl(option.imageUrl);
                img.alt = option.label;
                optionEl.appendChild(img);
            }

            // Add label
            const label = document.createElement('div');
            label.className = 'option-label';
            label.textContent = option.label;
            optionEl.appendChild(label);

            // Add click handler
            optionEl.addEventListener('click', function() {
                // Remove selected class from all options
                multipleChoiceGrid.querySelectorAll('.choice-option').forEach(opt => {
                    opt.classList.remove('selected', 'correct', 'incorrect');
                });
                // Add selected class to clicked option
                this.classList.add('selected');
                console.log('Option clicked:', this.dataset.value); // Debug log

                // Không phát lại âm thanh khi click vào các lựa chọn
                // Chỉ đánh dấu lựa chọn được chọn

                // Đảm bảo nút submit được hiển thị và có thể click
                const submitBtn = document.getElementById('game-submit-btn');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.display = 'block';
                }
            });

            multipleChoiceGrid.appendChild(optionEl);
        });

        // Hide image container for level 3 as we're showing images in the options
        imgCont.style.display = 'none';

        // Auto-play audio for level 3
        if (audio) {
            setTimeout(() => {
                audio.play()
                    .then(() => {
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    })
                    .catch(err => {
                        console.error('Error playing audio:', err);
                        // Try again after user interaction
                        playBtn.addEventListener('click', function playOnce() {
                            audio.play();
                            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                            playBtn.removeEventListener('click', playOnce);
                        }, { once: true });
                    });
            }, 500);
        }
    } else {
        // Show text input, hide multiple choice
        if (textAnswerCont) textAnswerCont.style.display = 'block';
        if (multipleChoiceCont) multipleChoiceCont.style.display = 'none';

        // Focus on text input
        if (ans && data.level !== 3 && data.level !== '3') {
            setTimeout(() => {
                ans.focus();
            }, 300);
        }
    }

    // Auto-play audio if available
    if (audio && data.audioUrl && (data.level === 2 || data.level === '2')) {
        setTimeout(() => {
            audio.play()
                .then(() => {
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                })
                .catch(err => {
                    console.error('Error auto-playing audio:', err);
                });
        }, 500);
    }
}
async function submitMiniGameAnswer() {
    console.log('submitMiniGameAnswer called');
    if (!currentMiniGame) {
        console.error('No current mini-game');
        return;
    }

    const m = document.getElementById('mini-game-modal');
    const multipleChoiceCont = m?.querySelector('#multiple-choice-container');
    const multipleChoiceGrid = m?.querySelector('#multiple-choice-grid');
    const ans = m?.querySelector('#game-answer');
    const fb = m?.querySelector('#game-feedback');
    const btn = m?.querySelector('#game-submit-btn');
    const audio = m?.querySelector('#game-audio');

    if (!m || !fb || !btn) {
        console.error('Missing modal, feedback or button element');
        return;
    }

    // Disable the button to prevent multiple submissions
    btn.disabled = true;

    let userAns = '';

    // Get answer based on game level
    if ((currentMiniGame.level === 3 || currentMiniGame.level === '3') && multipleChoiceCont && multipleChoiceGrid) {
        console.log('Level 3 submission');
        // For level 3, get the selected option
        const selectedOption = multipleChoiceGrid.querySelector('.choice-option.selected');
        if (!selectedOption) {
            fb.innerHTML = `<div class="error">Vui lòng chọn một đáp án</div>`;
            btn.disabled = false;
            console.error('No option selected');
            return;
        }
        userAns = selectedOption.dataset.value;
        console.log('Selected option value:', userAns); // Debug log

        // Disable all options while submitting
        multipleChoiceGrid.querySelectorAll('.choice-option').forEach(opt => {
            opt.style.pointerEvents = 'none';
        });
    } else {
        // For levels 1-2, get the text input
        if (!ans) {
            console.error('No answer input found');
            btn.disabled = false;
            return;
        }
        userAns = ans.value.trim();
        if (!userAns) {
            fb.innerHTML = `<div class="error">Vui lòng nhập đáp án</div>`;
            btn.disabled = false;
            ans.focus();
            return;
        }
    }

    btn.disabled = true;
    btn.textContent = getTranslation('checking');
    fb.innerHTML = '';

    if (ans) ans.classList.remove('correct', 'incorrect');

    try {
        console.log('Submitting answer:', userAns, 'for game ID:', currentMiniGame.gameId); // Debug log
        const r = await apiFetch('/api/mini-game/submit', {
            method: 'POST',
            body: JSON.stringify({
                gameId: currentMiniGame.gameId,
                answer: userAns
            })
        });

        const res = await r.json();

        if (res.isCorrect) {
            // Show success feedback
            fb.textContent = `${getTranslation('game-correct')} ${res.pointsAwarded > 0 ? `+${res.pointsAwarded} ${getTranslation('game-points')}!` : ''}`;
            fb.className = 'feedback-area success';

            // Add animation to feedback area
            fb.style.animation = 'pulse 1.5s infinite';

            // Disable inputs
            if (ans) {
                ans.disabled = true;
                ans.classList.add('correct');
            }

            if (currentMiniGame.level === 3 && multipleChoiceGrid) {
                // Highlight the correct answer
                const selectedOption = multipleChoiceGrid.querySelector('.choice-option.selected');
                console.log('Selected option for correct answer:', selectedOption); // Debug log
                if (selectedOption) {
                    selectedOption.classList.remove('selected');
                    selectedOption.classList.add('correct');
                }

                // Disable all options
                multipleChoiceGrid.querySelectorAll('.choice-option').forEach(opt => {
                    opt.style.pointerEvents = 'none';
                    opt.classList.add('disabled');
                });

                // Play success sound
                if (audio) {
                    audio.pause();
                }
                playSound('success');

                // After a short delay, play the level complete sound
                setTimeout(() => {
                    playSound('level-complete');
                }, 1000);

                // Add animation to the correct option
                if (selectedOption) {
                    selectedOption.classList.add('pulse-animation');
                }
            } else {
                // Play success sound
                playSound('success');

                // After a short delay, play the level complete sound
                setTimeout(() => {
                    playSound('level-complete');
                }, 1000);
            }

            // Award points
            if (res.pointsAwarded > 0) {
                await updateUserProgressAndPoints(
                    res.pointsAwarded,
                    5,
                    `Mini-Game: ${getTranslation(currentMiniGame.gameType)} (Level ${currentMiniGame.level})`
                );
            }

            // Update button to show next question
            btn.textContent = getTranslation('next-question');
            btn.style.display = 'block'; // Make sure the button is visible
            btn.disabled = false; // Make sure the button is enabled
            btn.classList.add('next-question-btn'); // Add special class for styling

            // Thay đổi handler của nút để chuyển sang câu hỏi tiếp theo
            btn.onclick = function() {
                console.log('Next question button clicked');
                btn.disabled = true; // Disable button while loading
                btn.textContent = getTranslation('loading'); // Show loading text
                btn.classList.remove('next-question-btn'); // Remove special styling

                // Use setTimeout to ensure the UI updates before loading the next question
                setTimeout(async () => {
                    try {
                        // Reset to original handler for next question
                        btn.onclick = submitMiniGameAnswer;

                        // Load next question
                        await loadNextMiniGameQuestion();
                    } catch (err) {
                        console.error('Error loading next question:', err);
                        showNotification(getTranslation('load-game-error'), 'error');
                        btn.disabled = false;
                        btn.textContent = getTranslation('next-question');
                        btn.classList.add('next-question-btn');
                    }
                }, 100); // Small delay to allow UI to update
            };

            // Don't auto-close modal, let user click next
        } else {
            // Show error feedback
            fb.innerHTML = `${getTranslation('game-incorrect')} ${res.correctAnswer ? `<strong>${res.correctAnswer}</strong>` : ''}`;
            fb.className = 'feedback-area error';

            if (ans) {
                ans.disabled = false;
                ans.classList.add('incorrect');
                ans.select();
                ans.focus();
            }

            if (currentMiniGame.level === 3 && multipleChoiceGrid) {
                // Highlight the incorrect answer
                const selectedOption = multipleChoiceGrid.querySelector('.choice-option.selected');
                console.log('Selected option for incorrect answer:', selectedOption); // Debug log
                if (selectedOption) {
                    selectedOption.classList.remove('selected');
                    selectedOption.classList.add('incorrect');
                }

                // Disable all options
                multipleChoiceGrid.querySelectorAll('.choice-option').forEach(opt => {
                    opt.style.pointerEvents = 'none';
                    opt.classList.add('disabled');
                });

                // Find and highlight the correct option if provided
                if (res.correctAnswer) {
                    console.log('Correct answer from server:', res.correctAnswer); // Debug log
                    const correctOption = Array.from(multipleChoiceGrid.querySelectorAll('.choice-option'))
                        .find(opt => opt.dataset.value.toLowerCase() === res.correctAnswer.toLowerCase());
                    console.log('Found correct option:', correctOption); // Debug log
                    if (correctOption) {
                        correctOption.classList.add('correct');
                        correctOption.classList.add('pulse-animation');
                    }
                }

                // Play error sound
                if (audio) {
                    audio.pause();
                }
                playSound('error');
            } else {
                // Play error sound
                playSound('error');
            }

            btn.disabled = false;
            btn.style.display = 'block'; // Make sure the button is visible
            btn.textContent = getTranslation('try-again');
            btn.classList.add('retry-btn'); // Add special class for styling

            // Change button handler to retry function
            btn.onclick = function() {
                console.log('Retry button clicked');
                btn.disabled = true; // Disable button while loading
                btn.textContent = getTranslation('loading'); // Show loading text
                btn.classList.remove('retry-btn'); // Remove special styling

                // Reset the current mini-game
                resetMiniGame();

                // Reset button handler to submit function
                btn.onclick = submitMiniGameAnswer;
            };
        }
    } catch (err) {
        console.error("Submit game err:", err);
        if (err.message !== getTranslation('session-expired')) {
            fb.textContent = err.message || getTranslation('game-submit-error');
            fb.className = 'feedback-area error';
        }
        btn.disabled = false;
        btn.style.display = 'block'; // Make sure the button is visible
        btn.textContent = getTranslation('submit-test');
        btn.onclick = submitMiniGameAnswer; // Reset to original handler
    }
}

// --- Learning Path ---
async function fetchLearningPath(){if(!currentUser){clearLearningPathUI();return;}console.log("Fetching LP...");const grid=document.getElementById('learning-path-grid');if(grid)grid.innerHTML=`<p class="loading-message">${getTranslation('loading-path')}</p>`;try{const r=await apiFetch('/api/learning-path');learningPathItems=await r.json();renderLearningPath(learningPathItems);}catch(err){console.error("Fetch LP error:",err);clearLearningPathUI('fetch-path-error');if(err.message!==getTranslation('session-expired'))showNotification(getTranslation('fetch-path-error'),'error');}}
function renderLearningPath(items){const grid=document.getElementById('learning-path-grid');if(!grid)return;grid.innerHTML='';if(!currentUser){grid.innerHTML=`<p class="placeholder">${getTranslation('please-login-path')}</p>`;return;}if(!items||items.length===0){grid.innerHTML=`<p class="placeholder">${getTranslation('no-learning-path')}</p>`;return;}items.forEach(item=>{const el=createLearningPathItem(item);grid.appendChild(el);if(anime&&!el.dataset.animated){anime({targets:el,opacity:[0,1],translateY:[30,0],duration:500,easing:'easeOutExpo'});el.dataset.animated='true';}});grid.querySelectorAll('.start-path-item').forEach(b=>{b.removeEventListener('click',handleStartLearningPathItem);b.addEventListener('click',handleStartLearningPathItem);});}
function createLearningPathItem(item){const d=document.createElement('div');const completed=currentUser?.completedPathItems?.includes(item._id);const unlocked=true;d.className=`content-card learning-path-item ${completed?'completed':''} ${!unlocked?'locked':''}`;d.dataset.pathId=item._id;let icon='fa-book';if(item.type==='challenge')icon='fa-trophy';else if(item.type==='quiz'||item.type==='flashcard_test')icon='fa-question-circle';else if(item.type==='video')icon='fa-video';else if(item.type==='article')icon='fa-file-alt';else if(item.type==='course')icon='fa-graduation-cap';d.innerHTML=`<div class="path-item-header"><i class="fas ${icon} path-icon"></i><h3>${item.order||''}. ${item.title||'Step'}</h3></div><p>${item.description||''}</p><div class="path-item-status">${completed?`<span class="status-badge completed"><i class="fas fa-check"></i> ${getTranslation('completed')}</span>`:unlocked?`<button class="action-btn start-path-item ripple-btn" data-item-type="${item.type}" data-item-id="${item.relatedId||item._id}"><i class="fas fa-play"></i> ${getTranslation('start')}</button>`:`<span class="status-badge locked"><i class="fas fa-lock"></i> ${getTranslation('locked')}</span>`}</div>`;return d;}
function clearLearningPathUI(errKey=null){const grid=document.getElementById('learning-path-grid');if(grid){const pKey=errKey?errKey:(!currentUser?'please-login-path':'no-learning-path');grid.innerHTML=`<p class="placeholder ${errKey?'error':''}">${getTranslation(pKey)}</p>`;}}
async function handleStartLearningPathItem(e) {
    const btn = e.target.closest('.start-path-item');
    if (!btn) return;

    const type = btn.dataset.itemType;
    const id = btn.dataset.itemId;
    const pathId = btn.closest('.learning-path-item')?.dataset.pathId;

    console.log(`Start LP: ${type}, ${id}, Path ID: ${pathId}`);

    // Show loading indicator
    showLoading();

    try {
        switch (type) {
            case 'course':
                // Handle course learning path item
                await handleLearnAction(id);
                break;

            case 'challenge':
                // Navigate to challenges section
                showSection('challenges');
                // If we have a specific challenge ID, try to load it
                if (id && id !== 'daily') {
                    try {
                        const r = await apiFetch(`/api/challenges/${id}`);
                        const challenge = await r.json();
                        if (challenge) {
                            currentDailyChallenge = challenge;
                            renderChallenge(challenge);
                        }
                    } catch (err) {
                        console.error('Error fetching specific challenge:', err);
                        // Fall back to daily challenge
                        fetchDailyChallenge();
                    }
                } else {
                    // Just load the daily challenge
                    fetchDailyChallenge();
                }
                break;

            case 'quiz':
                // Open quiz modal
                showSection('flashcards');
                setTimeout(() => {
                    openFlashcardTestModal(false);
                }, 500);
                break;

            case 'flashcard_test':
                // Open flashcard test with random cards
                showSection('flashcards');
                setTimeout(() => {
                    openFlashcardTestModal(true);
                }, 500);
                break;

            case 'video':
                // Open video in new tab
                if (id && id.includes('http')) {
                    window.open(id, '_blank');
                    markLearningPathItemCompleted(pathId);
                } else {
                    showNotification(getTranslation('invalid-video-url'), 'error');
                }
                break;

            case 'article':
                // Open article in new tab
                if (id && id.includes('http')) {
                    window.open(id, '_blank');
                    markLearningPathItemCompleted(pathId);
                } else {
                    showNotification(getTranslation('invalid-article-url'), 'error');
                }
                break;

            default:
                showNotification(`Unknown item type: ${type}`, 'warning');
        }
    } catch (err) {
        console.error(`Error handling learning path item (${type}):`, err);
        showNotification(getTranslation('learning-path-error'), 'error');
    } finally {
        hideLoading();
    }
}

// Function to mark a learning path item as completed
async function markLearningPathItemCompleted(pathId) {
    if (!currentUser || !pathId) return;

    try {
        const r = await apiFetch('/api/learning-path/complete', {
            method: 'POST',
            body: JSON.stringify({ pathItemId: pathId })
        });

        const result = await r.json();

        if (result.success) {
            // Update local user data
            if (!currentUser.completedPathItems) {
                currentUser.completedPathItems = [];
            }

            if (!currentUser.completedPathItems.includes(pathId)) {
                currentUser.completedPathItems.push(pathId);
            }

            // Update UI
            const pathItem = document.querySelector(`.learning-path-item[data-path-id="${pathId}"]`);
            if (pathItem) {
                pathItem.classList.add('completed');
                const statusArea = pathItem.querySelector('.path-item-status');
                if (statusArea) {
                    statusArea.innerHTML = `<span class="status-badge completed"><i class="fas fa-check"></i> ${getTranslation('completed')}</span>`;
                }
            }

            // Award points for completing a learning path item
            updateUserProgressAndPoints(10, 5, 'Completed Learning Path Item');
            showNotification(getTranslation('path-item-completed'), 'success');
        } else {
            showNotification(getTranslation('path-item-completion-error'), 'error');
        }
    } catch (err) {
        console.error('Error marking learning path item as completed:', err);
        showNotification(getTranslation('path-item-completion-error'), 'error');
    }
}

// --- User Feedback Section ---
async function fetchUserFeedback(){if(!currentUser){clearUserFeedbackUI();return;}console.log("Fetching user feedback...");const list=document.getElementById('user-feedback-list');if(list)list.innerHTML=`<p class="loading-message">${getTranslation('loading-feedback')}</p>`;try{const r=await apiFetch('/api/feedback');userFeedbackList=await r.json();renderUserFeedbackList(userFeedbackList);}catch(err){console.error("Fetch feedback err:",err);clearUserFeedbackUI('fetch-feedback-error');if(err.message!==getTranslation('session-expired'))showNotification(getTranslation('fetch-feedback-error'),'error');}}
function renderUserFeedbackList(items){const list=document.getElementById('user-feedback-list');if(!list)return;list.innerHTML='';if(!currentUser){list.innerHTML=`<p class="placeholder">${getTranslation('please-login')}</p>`;return;}if(!items||items.length===0){list.innerHTML=`<p class="placeholder">${getTranslation('no-feedback-submitted')}</p>`;return;}items.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));items.forEach(fb=>{const el=createUserFeedbackItem(fb);list.appendChild(el);if(anime&&!el.dataset.animated){anime({targets:el,opacity:[0,1],translateX:[-20,0],duration:500,easing:'easeOutQuad'});el.dataset.animated='true';}});}
function createUserFeedbackItem(fb){const d=document.createElement('div');const statusKey=fb.status||'pending';d.className=`user-feedback-item status-${statusKey}`;const statusText=getTranslation(statusKey);d.innerHTML=`<p class="feedback-text-display"><strong>${getTranslation('your-feedback')}:</strong> ${fb.text||'N/A'}</p><p class="feedback-meta"><span class="feedback-date" title="${new Date(fb.createdAt).toISOString()}">${getTranslation('submitted')}: ${new Date(fb.createdAt).toLocaleString()}</span> | <span class="feedback-status">${getTranslation('status')}: <span class="status-label">${statusText}</span></span></p>${fb.reply?`<hr class="reply-divider"><div class="feedback-reply"><p><strong>${getTranslation('admin-reply')}:</strong> ${fb.reply}</p><p class="feedback-meta">${getTranslation('replied')}: ${fb.repliedAt?new Date(fb.repliedAt).toLocaleString():'N/A'}</p></div>`:''}`;return d;}
function clearUserFeedbackUI(errKey=null){const list=document.getElementById('user-feedback-list');if(list){const pKey=errKey?errKey:(!currentUser?'please-login':'no-feedback-submitted');list.innerHTML=`<p class="placeholder ${errKey?'error':''}">${getTranslation(pKey)}</p>`;}}
async function handleFeedbackSubmit(e){e.preventDefault();if(!currentUser){showNotification(getTranslation('please-login'),'error');openAuthModal(true);return;}const ta=document.getElementById('feedback-text-user');const text=ta.value.trim();if(!text){showNotification(getTranslation('feedback-text-empty'),'error');ta.focus();return;}showLoading();try{const r=await apiFetch('/api/feedback',{method:'POST',body:JSON.stringify({text,url:window.location.href})});const res=await r.json();showNotification(res.message||getTranslation('feedback-submitted'),'success');ta.value='';userFeedbackList.unshift(res.feedback);renderUserFeedbackList(userFeedbackList);}catch(err){console.error("Feedback submit err:",err);if(err.message!==getTranslation('session-expired'))showNotification(err.message||getTranslation('feedback-error'),'error');}finally{hideLoading();}}

// --- Chatbot ---
function initChatbot() {
    const micBtn = document.getElementById('start-speech-btn');
    const speechBtn = document.getElementById('toggle-speech-btn');

    // Khởi tạo nhận dạng giọng nói
    if (micBtn) {
        // Check for speech recognition support
        const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

        if (hasSpeechRecognition) {
            // Create the appropriate speech recognition object
            let SpeechRecognitionClass = null;

            if ('SpeechRecognition' in window) {
                SpeechRecognitionClass = window['SpeechRecognition'];
            } else if ('webkitSpeechRecognition' in window) {
                SpeechRecognitionClass = window['webkitSpeechRecognition'];
            }

            if (SpeechRecognitionClass) {
                recognition = new SpeechRecognitionClass();
                recognition.continuous = false;
                recognition.lang = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;
                recognition.onresult = handleSpeechResult;
                recognition.onerror = handleSpeechError;
                recognition.onstart = () => {
                    isRecognizing = true;
                    updateMicButtonState();
                };
                recognition.onend = () => {
                    if (isRecognizing) {
                        isRecognizing = false;
                        updateMicButtonState();
                    }
                };
                micBtn.disabled = false;
                micBtn.classList.remove('disabled');
            }
        } else {
            console.warn('SR not supported.');
            micBtn.disabled = true;
            micBtn.title = getTranslation('speech-recognition-not-supported');
            micBtn.classList.add('disabled');
        }
    } else {
        console.warn("Mic btn missing.");
    }

    // Khởi tạo tổng hợp giọng nói
    if (speechBtn) {
        if (!('speechSynthesis' in window)) {
            console.warn('SS not supported.');
            speechBtn.disabled = true;
            speechBtn.classList.add('disabled');
            speechBtn.title = getTranslation('speech-synthesis-not-supported');
            isSpeechEnabled = false;
        } else {
            synthesis.getVoices();
            if (synthesis.onvoiceschanged !== undefined) {
                synthesis.onvoiceschanged = () => console.log("Voices loaded.");
            }
            speechBtn.disabled = false;
            speechBtn.classList.remove('disabled');
        }
    } else {
        isSpeechEnabled = false;
    }

    updateSpeechToggleButton();

    // Xóa tin nhắn cũ và hiển thị tin nhắn chào
    clearChatbotUI();

    if (currentUser) {
        loadChatHistory();
    } else {
        appendChatMessage(getTranslation('chatbot-login-prompt'), 'bot');
    }
}
function toggleChatbot() {
    const bot = document.getElementById('chatbot');
    const btn = document.getElementById('chatbot-toggle');

    if (!bot || !btn) return;

    const open = bot.style.display === 'none' || bot.style.display === '';

    if (open) {
        // Hiển thị chatbot
        if (currentUser && chatbotHistory.length === 0) {
            loadChatHistory();
        } else if (!currentUser && chatbotHistory.length === 0) {
            clearChatbotUI();
            appendChatMessage(getTranslation('chatbot-login-prompt'), 'bot');
        }

        bot.style.display = 'flex';
        btn.classList.add('open');
        btn.innerHTML = '<i class="fas fa-times"></i>';

        if (anime) {
            anime({
                targets: bot,
                translateY: ['100%', '0%'],
                opacity: [0, 1],
                duration: 400,
                easing: 'easeOutQuad'
            });
        }

        document.getElementById('chat-input')?.focus();
    } else {
        // Ẩn chatbot
        if (anime) {
            anime({
                targets: bot,
                translateY: '100%',
                opacity: 0,
                duration: 300,
                easing: 'easeInQuad',
                complete: () => {
                    bot.style.display = 'none';
                }
            });
        } else {
            bot.style.display = 'none';
        }

        btn.classList.remove('open');
        btn.innerHTML = '<i class="fas fa-comment-alt"></i>';

        // Dừng nhận dạng và phát âm thanh
        if (isRecognizing) stopSpeechRecognition();
        if (synthesis?.speaking) synthesis.cancel();
    }
}
function appendChatMessage(msg, sender='user', time=null) {
    const body = document.getElementById('chatbot-body');
    if (!body) return;

    // Create message container
    const div = document.createElement('div');
    div.classList.add('chat-message', sender === 'bot' ? 'bot-message' : 'user-message');

    // Add avatar for bot messages
    if (sender === 'bot') {
        const avatar = document.createElement('div');
        avatar.classList.add('message-avatar');
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        div.appendChild(avatar);
    } else {
        // Add user avatar for user messages
        const avatar = document.createElement('div');
        avatar.classList.add('message-avatar');
        if (currentUser && currentUser.avatar) {
            avatar.innerHTML = `<img src="${getFullAssetUrl(currentUser.avatar)}" alt="User" class="user-avatar-small">`;
        } else {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }
        div.appendChild(avatar);
    }

    // Create message content container
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('message-content-wrapper');

    // Add message content
    const content = document.createElement('div');
    content.classList.add('message-content');

    // Process markdown-like formatting in messages
    let formattedMsg = msg
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Handle suggested questions in bot messages
    if (sender === 'bot' && formattedMsg.includes('**Câu hỏi gợi ý:**')) {
        const parts = formattedMsg.split('**Câu hỏi gợi ý:**');

        // Main message content
        content.innerHTML = `<p>${parts[0]}</p>`;

        // Add suggested questions as clickable elements
        if (parts[1]) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'suggested-questions';

            // Extract questions (format: "1. Question text\n")
            const questionMatches = parts[1].match(/\d+\.\s+(.*?)(?=\n|$)/g);

            if (questionMatches && questionMatches.length > 0) {
                questionMatches.forEach(match => {
                    const questionText = match.replace(/^\d+\.\s+/, '').trim();
                    const btn = document.createElement('button');
                    btn.className = 'suggested-question-btn';
                    btn.textContent = questionText;
                    btn.addEventListener('click', () => sendChatMessage(questionText));
                    suggestionsDiv.appendChild(btn);
                });
                contentWrapper.appendChild(suggestionsDiv);
            }
        }
    } else {
        // Regular message formatting
        content.innerHTML = `<p>${formattedMsg}</p>`;
    }

    contentWrapper.insertBefore(content, contentWrapper.firstChild);

    // Add timestamp
    const ts = document.createElement('div');
    ts.classList.add('message-time');
    ts.textContent = time ? new Date(time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                         : new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    contentWrapper.appendChild(ts);

    div.appendChild(contentWrapper);

    // Add to chat body
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;

    // Speak text if it's a bot message and speech is enabled
    if (sender === 'bot' && isSpeechEnabled && synthesis && msg) {
        // Clean up text for speech (remove markdown and suggestions)
        const cleanText = msg.replace(/\*\*(.*?)\*\*/g, '$1')
                            .replace(/\n\n\*\*Câu hỏi gợi ý:\*\*[\s\S]*$/, '');
        speakText(cleanText);
    }

    // Add animation if anime.js is available
    if (window.anime) {
        anime({
            targets: div,
            opacity: [0, 1],
            translateY: [15, 0],
            scale: [0.97, 1],
            duration: 400,
            easing: 'easeOutCubic'
        });
    }
}
async function sendChatMessage(messageOverride=null) {
    const input = document.getElementById('chat-input');
    const message = messageOverride ?? input?.value.trim();

    if (!message) return;

    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        openAuthModal(true);
        return;
    }

    if (synthesis?.speaking) synthesis.cancel();
    if (isRecognizing && !messageOverride) stopSpeechRecognition();

    if (!messageOverride) appendChatMessage(message, 'user');
    chatbotHistory.push({role: 'user', parts: [{text: message}]});
    if (input && !messageOverride) input.value = '';

    // Scroll to bottom of chat
    const chatBody = document.getElementById('chatbot-body');
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;

    try {
        // Normalize the question (remove extra spaces, lowercase, etc.)
        const normalizedQuestion = normalizeQuestion(message);

        // Format the question to be more standardized
        const formattedQuestion = formatQuestion(message);

        // Prepare the API request
        const basePrompt = `Bạn là Trợ lý FPT, một chatbot CSKH thân thiện, chuyên nghiệp và hữu ích cho nền tảng FPT Learning Hub (học Nhạc cụ dân tộc Việt Nam và Vovinam). Luôn trả lời bằng tiếng Việt.`;

        const userInfo = `Thông tin người dùng: Tên="${currentUser.name || 'Chưa biết'}", Email="${currentUser.email || 'Chưa biết'}", Level=${currentUser.level || 1}, Điểm=${currentUser.points || 0}, Thành tựu=[${(currentUser.achievements || []).join(', ')}].`;

        const taskPrompt = `Nhiệm vụ: Phân tích và trả lời câu hỏi sau của người dùng một cách tự nhiên, rõ ràng, và hữu ích. Nếu hỏi về thông tin cá nhân, hãy sử dụng thông tin được cung cấp. Nếu hỏi về cách sử dụng web, hãy hướng dẫn. Nếu hỏi kiến thức chung về nhạc cụ/võ thuật, hãy trả lời. Nếu hỏi về khóa học cụ thể, gợi ý xem phần Khám phá. Nếu không biết hoặc ngoài phạm vi, hãy lịch sự từ chối.`;

        const historyText = chatbotHistory.slice(-CHAT_HISTORY_LENGTH + 1).map(m => `${m.role}: ${m.parts[0].text}`).join('\n');
        const fullContext = `${basePrompt}\n${userInfo}\n${taskPrompt}\n\nLịch sử chat:\n${historyText}\n\nCâu hỏi mới: ${formattedQuestion}`;

        const historyToSend = chatbotHistory.slice(-CHAT_HISTORY_LENGTH);
        const payload = {
            question: fullContext,
            history: historyToSend
        };

        // First try to get a response from the Gemini API
        try {
            const r = await apiFetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const d = await r.json();
            const botReply = d.reply || null;

            if (botReply) {
                // Add suggested questions based on the response
                const enhancedReply = addSuggestedQuestions(botReply, normalizedQuestion);

                appendChatMessage(enhancedReply, 'bot');
                chatbotHistory.push({role: 'model', parts: [{text: botReply}]});
                saveChatHistory();
                return;
            }
        } catch (apiError) {
            console.warn("API error, falling back to local data:", apiError);
            // If API fails, we'll fall back to local data
        }

        // If API failed or returned no response, try to find information in our courses data
        const courseInfo = searchCoursesData(normalizedQuestion);
        if (courseInfo) {
            appendChatMessage(courseInfo, 'bot');
            chatbotHistory.push({role: 'model', parts: [{text: courseInfo}]});
            saveChatHistory();
            return;
        }

        // Next, try to find information in flashcards data
        const flashcardInfo = searchFlashcardsData(normalizedQuestion);
        if (flashcardInfo) {
            appendChatMessage(flashcardInfo, 'bot');
            chatbotHistory.push({role: 'model', parts: [{text: flashcardInfo}]});
            saveChatHistory();
            return;
        }

        // If all else fails, show a generic response
        const fallbackResponse = `Xin lỗi, hiện tại tôi không thể trả lời câu hỏi này. Bạn có thể thử hỏi câu hỏi khác hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.`;
        appendChatMessage(fallbackResponse, 'bot');
        chatbotHistory.push({role: 'model', parts: [{text: fallbackResponse}]});
        saveChatHistory();

    } catch (err) {
        console.error("Chatbot send err:", err);
        const msg = err.message?.includes('HTTP') ? getTranslation('server-error') : (err.message || getTranslation('no-response'));
        appendChatMessage(`${getTranslation('error')}: ${msg}`, 'bot');
    } finally {
        // hideChatbotLoading() - Removed as per user request
        input?.focus();
    }
}

// Helper functions for the enhanced chatbot
function normalizeQuestion(question) {
    return question.toLowerCase().trim().replace(/\s+/g, ' ');
}

function formatQuestion(question) {
    // Format the question to be more standardized
    let formatted = question.trim();

    // Add question mark if missing
    if (!formatted.endsWith('?') && !formatted.endsWith('.') && !formatted.endsWith('!')) {
        formatted += '?';
    }

    // Capitalize first letter
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    return formatted;
}

function searchCoursesData(question) {
    // Search through courses data for relevant information
    const allCourses = [...(courses.instruments || []), ...(courses.martialArts || [])];

    if (allCourses.length === 0) return null;

    const matchingCourses = allCourses.filter(course => {
        const title = course.title?.toLowerCase() || '';
        const description = course.description?.toLowerCase() || '';
        const type = course.type?.toLowerCase() || '';

        return question.includes(title) ||
               question.includes(type) ||
               (description && question.split(' ').some(word => description.includes(word)));
    });

    if (matchingCourses.length > 0) {
        let response = `Tôi tìm thấy ${matchingCourses.length} khóa học liên quan đến câu hỏi của bạn:\n\n`;

        matchingCourses.forEach((course, index) => {
            response += `${index + 1}. **${course.title}**\n`;
            response += `   ${course.description}\n`;
            response += `   Giảng viên: ${course.instructor}, Thời lượng: ${course.duration}\n\n`;
        });

        response += `Bạn có thể tìm hiểu thêm trong phần Khám phá của trang web.`;
        return response;
    }

    return null;
}

function searchFlashcardsData(question) {
    // Search through flashcards data for relevant information
    const allFlashcards = Object.values(flashcardsData).flat();

    if (allFlashcards.length === 0) return null;

    // Only match if we have valid data to avoid undefined responses
    const matchingFlashcards = allFlashcards.filter(card => {
        const front = card.front?.toLowerCase() || '';
        const back = card.back?.toLowerCase() || '';

        // Skip cards with empty or undefined content
        if (!front || !back) return false;

        return question.includes(front) ||
               front.includes(question) ||
               question.includes(back) ||
               back.includes(question);
    });

    if (matchingFlashcards.length > 0) {
        let response = `Tôi tìm thấy ${matchingFlashcards.length} thẻ ghi nhớ liên quan đến câu hỏi của bạn:\n\n`;

        matchingFlashcards.forEach((card, index) => {
            // Ensure we don't display undefined values
            const frontText = card.front || 'Không có tiêu đề';
            const backText = card.back || 'Không có nội dung';

            response += `${index + 1}. **${frontText}**\n`;
            response += `   ${backText}\n\n`;
        });

        response += `Bạn có thể xem thêm trong phần Flashcards của trang web.`;
        return response;
    }

    return null;
}

function addSuggestedQuestions(reply, originalQuestion) {
    // Generate suggested follow-up questions based on the reply and original question
    const suggestions = [];

    // Add suggestions based on the topic
    if (originalQuestion.includes('sáo') || reply.toLowerCase().includes('sáo')) {
        suggestions.push('Làm thế nào để bảo quản sáo trúc?');
        suggestions.push('Có khóa học sáo trúc nào cho người mới bắt đầu?');
    }

    if (originalQuestion.includes('đàn tranh') || reply.toLowerCase().includes('đàn tranh')) {
        suggestions.push('Đàn tranh có bao nhiêu dây?');
        suggestions.push('Kỹ thuật cơ bản khi chơi đàn tranh?');
    }

    if (originalQuestion.includes('vovinam') || reply.toLowerCase().includes('vovinam')) {
        suggestions.push('Lịch sử hình thành của Vovinam?');
        suggestions.push('Các bài quyền cơ bản trong Vovinam?');
    }

    // Add general suggestions
    if (suggestions.length < 2) {
        suggestions.push('Làm thế nào để bắt đầu học nhạc cụ dân tộc?');
        suggestions.push('Các khóa học phổ biến nhất trên FPT Learning Hub?');
    }

    // Add the suggestions to the reply if we have any
    if (suggestions.length > 0) {
        let enhancedReply = reply;

        enhancedReply += '\n\n**Câu hỏi gợi ý:**\n';
        suggestions.slice(0, 3).forEach((suggestion, index) => {
            enhancedReply += `${index + 1}. ${suggestion}\n`;
        });

        return enhancedReply;
    }

    return reply;
}
function showChatbotLoading() {
    // Loading indicator removed as per user request
    const b = document.getElementById('chatbot-body');
    if (b) b.scrollTop = b.scrollHeight;
}

function hideChatbotLoading() {
    // Loading indicator removed as per user request
}
function toggleSpeechRecognition(){if(!recognition){showNotification(getTranslation('speech-recognition-not-supported'),'warning');return;}if(isRecognizing)stopSpeechRecognition();else startSpeechRecognition();}function startSpeechRecognition(){if(isRecognizing||!recognition)return;try{if(synthesis?.speaking)synthesis.cancel();console.log('Starting SR...');recognition.lang=currentLanguage==='vi'?'vi-VN':'en-US';recognition.start();}catch(e){console.error("SR start err:",e);isRecognizing=false;updateMicButtonState();if(e.name!=='InvalidStateError')showNotification(getTranslation('speech-error-generic'),'error');}}function stopSpeechRecognition(){if(isRecognizing&&recognition){console.log('Stopping SR...');isRecognizing=false;recognition.stop();updateMicButtonState();}}
function handleSpeechResult(e){const transcript=e.results[0][0].transcript;console.log('SR result:',transcript);appendChatMessage(transcript,'user');sendChatMessage(transcript);}
function handleSpeechError(e){console.error('SR err:',e.error,e.message);let k='speech-error-generic';if(e.error==='no-speech')k='speech-error-no-speech';else if(e.error==='audio-capture')k='speech-error-audio-capture';else if(e.error==='not-allowed')k='speech-error-not-allowed';else if(e.error==='network')k='network-error';if(e.error!=='no-speech')showNotification(`${getTranslation('error')}: ${getTranslation(k)}`,'error');isRecognizing=false;updateMicButtonState();}function updateMicButtonState(){const b=document.getElementById('start-speech-btn');if(!b||b.disabled)return;const l=isRecognizing;b.classList.toggle('listening',l);b.title=getTranslation(l?'listening':'mic-tooltip');b.innerHTML=`<i class="fas ${l?'fa-microphone-slash':'fa-microphone'}"></i>`;}
function toggleSpeechOutput(){if(!synthesis||document.getElementById('toggle-speech-btn')?.disabled){showNotification(getTranslation('speech-synthesis-not-supported'),'warning');return;}isSpeechEnabled=!isSpeechEnabled;updateSpeechToggleButton();showNotification(isSpeechEnabled?getTranslation('speech-enabled'):getTranslation('speech-disabled'),'info');if(!isSpeechEnabled&&synthesis.speaking)synthesis.cancel();}function updateSpeechToggleButton(){const b=document.getElementById('toggle-speech-btn');if(!b)return;const a=isSpeechEnabled;b.classList.toggle('active',a);b.innerHTML=`<i class="fas ${a?'fa-volume-up':'fa-volume-mute'}"></i>`;b.title=getTranslation(a?'disable-speech':'enable-speech');b.dataset.translate=a?'disable-speech':'enable-speech';}
function speakText(text){if(!synthesis||!isSpeechEnabled||!text)return;if(synthesis.speaking)synthesis.cancel();const clean=text.replace(/<br\s*\/?>/gi,'\n').replace(/\*\*(.*?)\*\*/g,'$1');const u=new SpeechSynthesisUtterance(clean);const voices=synthesis.getVoices();let v=null;const lang=currentLanguage==='vi'?'vi-VN':'en-US';v=voices.find(vo=>vo.lang===lang);if(!v)v=voices.find(vo=>vo.lang.startsWith(currentLanguage));if(!v)v=voices.find(vo=>vo.default);if(v)u.voice=v;else console.warn(`No voice for ${lang}`);u.onerror=(e)=>console.error('TTS Err:',e.error);synthesis.speak(u);}

// --- Notifications ---
async function fetchUserNotifications() {
    if (!currentUser) {
        return;
    }

    console.log("Fetching user notifications...");

    try {
        // Use mock data instead of making an API call to avoid CORS issues
        // const r = await apiFetch('/api/notifications');
        // userNotifications = await r.json();

        // Mock data
        userNotifications = [
            {
                _id: 'mock1',
                type: 'system',
                message: 'Welcome to FPT Learning Hub!',
                read: false,
                createdAt: new Date().toISOString()
            }
        ];

        hasUnreadNotifications = userNotifications.some(notification => !notification.read);
        updateNotificationBadge();
    } catch (err) {
        console.error("Fetch notifications err:", err);
        if (err.message !== getTranslation('session-expired')) {
            showNotification(getTranslation('fetch-notifications-error'), 'error');
        }
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    if (hasUnreadNotifications) {
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function renderNotifications() {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    container.innerHTML = '';

    if (!userNotifications || userNotifications.length === 0) {
        container.innerHTML = `<p class="placeholder">${getTranslation('no-notifications')}</p>`;
        return;
    }

    // Sort notifications by date (newest first)
    userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    userNotifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        item.dataset.notificationId = notification._id;

        const date = notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'N/A';
        const statusClass = notification.status === 'approved' ? 'success' : notification.status === 'rejected' ? 'error' : '';

        item.innerHTML = `
            <div class="notification-header">
                <span class="notification-type ${statusClass}">${notification.type.replace('_', ' ')}</span>
                <span class="notification-date">${date}</span>
            </div>
            <div class="notification-content">
                <p>${notification.message}</p>
            </div>
            ${!notification.read ? `<button class="mark-read-btn" data-id="${notification._id}">${getTranslation('mark-as-read')}</button>` : ''}
        `;

        container.appendChild(item);
    });

    // Add event listeners to mark-as-read buttons
    container.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.addEventListener('click', handleMarkNotificationAsRead);
    });
}

async function handleMarkNotificationAsRead(e) {
    const btn = e.target;
    const notificationId = btn.dataset.id;

    if (!notificationId) return;

    try {
        // Mock API call to avoid CORS issues
        // const r = await apiFetch(`/api/notifications/${notificationId}/read`, {
        //     method: 'PUT'
        // });

        // Simulate successful response
        const mockResponse = { ok: true };

        if (mockResponse.ok) {
            // Update local notification data
            const notification = userNotifications.find(n => n._id === notificationId);
            if (notification) {
                notification.read = true;
            }

            // Update UI
            const item = document.querySelector(`.notification-item[data-notification-id="${notificationId}"]`);
            if (item) {
                item.classList.remove('unread');
                item.classList.add('read');
                btn.remove();
            }

            // Check if all notifications are read
            hasUnreadNotifications = userNotifications.some(notification => !notification.read);
            updateNotificationBadge();
        }
    } catch (err) {
        console.error("Mark notification as read error:", err);
        showNotification(getTranslation('notification-read-error'), 'error');
    }
}

function openNotificationsPanel() {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;

    renderNotifications();
    panel.classList.add('open');

    // Add close event listener
    document.addEventListener('click', closeNotificationsPanelOnClickOutside);
}

function closeNotificationsPanel() {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;

    panel.classList.remove('open');

    // Remove close event listener
    document.removeEventListener('click', closeNotificationsPanelOnClickOutside);
}

function closeNotificationsPanelOnClickOutside(e) {
    const panel = document.getElementById('notifications-panel');
    const bell = document.getElementById('notification-bell');

    if (!panel || !bell) return;

    if (!panel.contains(e.target) && !bell.contains(e.target)) {
        closeNotificationsPanel();
    }
}

// --- Chat History ---
function saveChatHistory(){if(!currentUser?._id)return;try{const k=`${CHAT_HISTORY_KEY_PREFIX}${currentUser._id}`;const l=chatbotHistory.slice(-CHAT_HISTORY_LENGTH);localStorage.setItem(k,JSON.stringify(l));}catch(e){console.error("Save history err:",e);}}
function loadChatHistory() {
    // Xóa tất cả tin nhắn hiện tại
    clearChatbotUI();

    // Nếu người dùng chưa đăng nhập, chỉ hiển thị thông báo yêu cầu đăng nhập
    if (!currentUser?._id) {
        chatbotHistory = [];
        appendChatMessage(getTranslation('chatbot-login-prompt'), 'bot');
        return;
    }

    const k = `${CHAT_HISTORY_KEY_PREFIX}${currentUser._id}`;
    const s = localStorage.getItem(k);

    if (s) {
        try {
            chatbotHistory = JSON.parse(s);
            if (chatbotHistory.length > 0) {
                // Nếu có lịch sử chat, hiển thị lịch sử
                chatbotHistory.forEach(m => {
                    if (m.parts?.[0]?.text && m.role) {
                        appendChatMessage(m.parts[0].text, m.role, false);
                    }
                });
            } else {
                // Nếu lịch sử rỗng, hiển thị tin nhắn chào
                chatbotHistory = [];
                appendChatMessage(getTranslation('chatbot-welcome'), 'bot');
            }
        } catch (e) {
            console.error("Parse history err:", e);
            localStorage.removeItem(k);
            chatbotHistory = [];
            appendChatMessage(getTranslation('chatbot-welcome'), 'bot');
        }
    } else {
        // Không có lịch sử, hiển thị tin nhắn chào
        chatbotHistory = [];
        appendChatMessage(getTranslation('chatbot-welcome'), 'bot');
    }

    // Cuộn xuống tin nhắn mới nhất
    const b = document.getElementById('chatbot-body');
    if (b) b.scrollTop = b.scrollHeight;
}
function clearChatbotCacheAndHistory() {
    if (!currentUser?._id) return;

    try {
        const k = `${CHAT_HISTORY_KEY_PREFIX}${currentUser._id}`;
        localStorage.removeItem(k);
        chatbotHistory = [];
        clearChatbotUI();
        appendChatMessage(getTranslation('chatbot-welcome'), 'bot');
        showNotification(getTranslation('chat-history-cleared'), 'success');
    } catch (e) {
        console.error("Clear history err:", e);
        showNotification(getTranslation('error-clearing-history'), 'error');
    }
}
function clearChatbotUI() {
    const b = document.getElementById('chatbot-body');
    if (b) b.innerHTML = ''; // Xóa tất cả tin nhắn trong chatbot
}
function exportChatHistory(){if(chatbotHistory.length===0){showNotification(getTranslation('no-history-to-export'),'info');return;}try{const t=chatbotHistory.map(m=>`[${m.role==='user'?(currentUser?.name||'User'):'Assistant'}] ${m.parts[0].text}`).join('\n\n');const b=new Blob([t],{type:'text/plain;charset=utf-8'});const l=document.createElement('a');l.href=URL.createObjectURL(b);const s=new Date().toISOString().slice(0,10);l.download=`fpt_hub_chat_${s}.txt`;document.body.appendChild(l);l.click();document.body.removeChild(l);URL.revokeObjectURL(l.href);showNotification(getTranslation('history-exported'),'success');}catch(e){console.error("Export history err:",e);showNotification(getTranslation('error-exporting-history'),'error');}}

// --- Teacher Specific Functions (Requires HTML Elements in index.html) ---
async function fetchTeacherAnalytics() { if (!currentUser || currentUser.role !== 'teacher') return; console.log("Fetching analytics..."); const container = document.getElementById('teacher-analytics-container'); if (container) container.innerHTML = `<p class="loading-message">${getTranslation('loading-analytics')}</p>`; try { const r = await apiFetch('/api/teacher/analytics'); teacherAnalytics = await r.json(); renderTeacherAnalytics(); } catch (err) { console.error("Fetch analytics err:", err); if (container) container.innerHTML = `<p class="placeholder error">${getTranslation('fetch-analytics-error')}</p>`; showNotification(getTranslation('fetch-analytics-error'), 'error'); } }
function renderTeacherAnalytics() { const c = document.getElementById('teacher-analytics-container'); if (!c) return; if (!teacherAnalytics) { c.innerHTML = `<p class="placeholder">${getTranslation('no-analytics')}</p>`; return; } c.innerHTML = `<h4>${getTranslation('teacher-analytics')}</h4> <p>${getTranslation('total-reviewed')}: ${teacherAnalytics.totalReviewed ?? 0}</p><p>${getTranslation('approved-count')}: ${teacherAnalytics.approvedCount ?? 0}</p><p>${getTranslation('rejected-count')}: ${teacherAnalytics.rejectedCount ?? 0}</p><p>${getTranslation('pending-submissions')}: ${teacherAnalytics.pendingSubmissions ?? 0}</p><p>${getTranslation('associated-students')}: ${teacherAnalytics.associatedStudents ?? 0}</p> <button id="view-students-btn" class="action-btn ripple-btn">${getTranslation('students-list')}</button>`; c.querySelector('#view-students-btn')?.addEventListener('click', fetchTeacherStudents); applyTranslations(c); }
function clearTeacherAnalyticsUI() { const c = document.getElementById('teacher-analytics-container'); if (c) c.innerHTML = ''; }
async function fetchTeacherStudents() {
    if (!currentUser || currentUser.role !== 'teacher') return;
    console.log("Fetching students...");

    const list = document.getElementById('teacher-students-list');
    if (list) list.innerHTML = `<p class="loading-message">${getTranslation('loading-students')}</p>`;

    try {
        // Use the correct teacher API endpoint
        const r = await apiFetch('/api/teacher/students');
        teacherStudents = await r.json();

        renderTeacherStudents();
    } catch (err) {
        console.error("Fetch students err:", err);

        // Check if we have mock data from previous fetch
        if (!teacherStudents || teacherStudents.length === 0) {
            // Use mock data if API fails
            console.log("Using mock student data due to API failure");
            teacherStudents = [{
                "_id": {
                  "$oid": "67cb2333d57fd05d715ba597"
                },
                "email": "test@example.com",
                "password": "pbkdf2:sha256:260000$ByW9vtIWZstM8kKM$f3e2f8e728a28f4ecc7bc67600494b6fd997aca5711d11b7abd11bbd07a71d6f",
                "name": "Chiến Dev",
                "role": "student",
                "progress": 57,
                "points": 284,
                "level": 3,
                "badges": [
                  "Beginner"
                ],
                "personalCourses": [
                  {
                    "$oid": "67cb2332d57fd05d715ba593"
                  },
                  {
                    "$oid": "67f69cce7648861444ac00c8"
                  }
                ],
                "avatar": "/uploads/avatars/avatar_67cb2333d57fd05d715ba597_1744317180.jpg",
                "created_at": {
                  "$date": "2025-03-07T16:47:47.192Z"
                },
                "last_login": {
                  "$date": "2025-03-08T18:47:36.404Z"
                },
                "streak": 5,
                "lastLogin": {
                  "$date": "2025-04-17T09:13:21.555Z"
                },
                "achievements": [
                  "Tân Binh",
                  "Học Viên Chăm Chỉ"
                ]
              },



              {
                "_id": {
                  "$oid": "67cc3fe61a774eaa8eb3730c"
                },
                "email": "teacher@fpt.edu.vn",
                "password": "pbkdf2:sha256:260000$ah0cNL7UsXOPCCvL$f6045ac8e972243f08b76abb4199aac0a10cf4c26f9c8390766a40b8cadc8731",
                "name": "Chiến DEV",
                "role": "teacher",
                "progress": 100,
                "points": 457,
                "level": 5,
                "badges": [
                  "Beginner Learner",
                  "Dedicated Student",
                  "Beginner",
                  "Advanced"
                ],
                "achievements": [
                  "Tân Binh",
                  "Học Viên Chăm Chỉ"
                ],
                "personalCourses": [
                  {
                    "$oid": "67cb2332d57fd05d715ba592"
                  },
                  {
                    "$oid": "67f69cce7648861444ac00ca"
                  },
                  {
                    "$oid": "67cb2332d57fd05d715ba593"
                  },
                  {
                    "$oid": "67cb2332d57fd05d715ba591"
                  }
                ],
                "avatar": "/uploads/avatars/avatar_67cc3fe61a774eaa8eb3730c_1744748882.jpg",
                "streak": 1,
                "last_login": {
                  "$date": "2025-04-09T14:46:37.763Z"
                },
                "created_at": {
                  "$date": "2025-03-08T13:02:30.214Z"
                },
                "flashcardProgress": {
                  "vovinam": {
                    "67c3329bba82119f525b51db": {
                      "answer": "Điều 1: Hoài bão và mục đích học võ.\nĐiều 2: Nghĩa vụ đối với môn phái và dân tộc.\nĐiều 3: Tình đoàn kết trong môn phái.\nĐiều 4: Võ kỷ và danh dự võ sĩ.\nĐiều 5: Ý thức dụng võ.\nĐiều 6: Ý hướng học tập và đời sống tinh thần.\nĐiều 7: Tâm nguyện sống.\nĐiều 8: Rèn luyện ý chí.\nĐiều 9: Nếp suy cảm, nghị lực và tính thực tế.\nĐiều 10: Đức sống và tinh thần cầu tiến.",
                      "category": "vovinam",
                      "question": "Ý nghĩa đại cương của 10 điều tâm niệm?"
                    },
                    "67cb2332d57fd05d715ba596": {
                      "answer": "Vovinam được sáng lập bởi võ sư Nguyễn Lộc.",
                      "category": "vovinam",
                      "question": "Vovinam được sáng lập bởi ai?"
                    },
                    "67f69ccf7648861444ac00d1": {
                      "answer": "Đai đỏ (Hồng đai)",
                      "category": "vovinam",
                      "question": "Màu đai cao nhất trong Vovinam là gì?"
                    },
                    "67f69ccf7648861444ac00d2": {
                      "answer": "Vovinam - Việt Võ Đạo",
                      "category": "vovinam",
                      "question": "Tên đầy đủ của Vovinam là gì?"
                    },
                    "67f69ccf7648861444ac00d3": {
                      "answer": "Đá thẳng về phía trước",
                      "category": "vovinam",
                      "question": "\"Chân tấn công\" là đòn đá nào?"
                    }
                  }
                },
                "lastLogin": {
                  "$date": "2025-04-17T09:13:49.931Z"
                }
              },
              {
                "_id": {
                  "$oid": "67cc44f590085e1172a29be8"
                },
                "email": "test1@example.com",
                "password": "pbkdf2:sha256:260000$XyhBMlXLYBSyegDn$4a8539f9443ed27ec1eb641fe6f314e43c8ae154fe7a47296e81a58f5593b92d",
                "name": "dev",
                "role": "student",
                "progress": 8,
                "points": 65,
                "level": 1,
                "badges": [],
                "achievements": [
                  "Tân Binh"
                ],
                "personalCourses": [],
                "avatar": "https://picsum.photos/50",
                "streak": 2,
                "last_login": {
                  "$date": "2025-03-08T13:33:36.941Z"
                },
                "created_at": {
                  "$date": "2025-03-08T13:24:05.630Z"
                },
                "flashcardProgress": {},
                "lastLogin": {
                  "$date": "2025-04-15T19:40:41.941Z"
                }
              },
              {
                "_id": {
                  "$oid": "67fd090d69bd78dd6325bed5"
                },
                "email": "quangchienaz3@gmail.com",
                "password": "pbkdf2:sha256:260000$EXIeRfOO8lRpmm78$a7c2ee1d2d887cb47833c1e40c7f69c6d012f4eac36c326250a320e12d236ea9",
                "name": "Chiến Test",
                "role": "student",
                "progress": 12,
                "points": 70,
                "level": 1,
                "badges": [],
                "achievements": [
                  "Tân Binh"
                ],
                "personalCourses": [],
                "avatar": "https://ui-avatars.com/api/?name=Chien+Test&background=random&color=fff&size=150",
                "streak": 2,
                "lastLogin": {
                  "$date": "2025-04-15T15:50:50.593Z"
                },
                "createdAt": {
                  "$date": "2025-04-14T13:09:33.338Z"
                },
                "flashcardProgress": {},
                "flashcardScore": 0
              },
              {
                "_id": {
                  "$oid": "67feb9d1ede29e99b22a14ce"
                },
                "email": "quangchienaz@gmail.com",
                "password": "pbkdf2:sha256:260000$wvlRoThNxgN2AhO9$eccce7d5fe91a7df6a2fa1a38183b36eea3deca383d6df5798e77f6679408762",
                "name": "Top1 nè",
                "role": "student",
                "progress": 19,
                "points": 87,
                "level": 1,
                "badges": [],
                "achievements": [
                  "Tân Binh"
                ],
                "personalCourses": [],
                "avatar": "/uploads/avatars/avatar_67feb9d1ede29e99b22a14ce_1744748024.jpg",
                "streak": 1,
                "lastLogin": {
                  "$date": "2025-04-16T09:47:39.466Z"
                },
                "createdAt": {
                  "$date": "2025-04-15T19:56:01.635Z"
                },
                "flashcardProgress": {},
                "flashcardScore": 0
              },
              {
                "_id": {
                  "$oid": "67fff6f3538942ec0f731d58"
                },
                "email": "letanphap6543@gmail.com",
                "password": "scrypt:32768:8:1$QlI73thBYz9wjDjg$0e4ebe8f17196197be547b7435553fcb10c44e5608be7d5adc53221210e4a996d36f52be18fd2ac474dfd41adc46295cc26e85ab8ccf647cf809336e7af7ba94",
                "name": "Tan Phap",
                "role": "student",
                "progress": 0,
                "points": 0,
                "level": 1,
                "badges": [],
                "achievements": [],
                "personalCourses": [],
                "avatar": "https://ui-avatars.com/api/?name=Tan+Phap&background=random&color=fff&size=150",
                "streak": 0,
                "lastLogin": null,
                "createdAt": {
                  "$date": "2025-04-16T18:29:07.424Z"
                },
                "flashcardProgress": {},
                "flashcardScore": 0
              },
              {
                "_id": {
                  "$oid": "6800bb4425a865f02762cde5"
                },
                "email": "studenttest@fpt.edu.vn",
                "password": "pbkdf2:sha256:260000$Ig6kRdXnkxJal51z$88b39c32035aa8f010938b5d9bb399f7fefb5efdaa5a279a91e88d5a76500d3b",
                "name": "Học viên",
                "role": "student",
                "progress": 0,
                "points": 0,
                "level": 1,
                "badges": [],
                "achievements": [],
                "personalCourses": [],
                "avatar": "https://ui-avatars.com/api/?name=Hoc+vien&background=random&color=fff&size=150",
                "streak": 0,
                "lastLogin": null,
                "createdAt": {
                  "$date": "2025-04-17T08:26:44.561Z"
                },
                "flashcardProgress": {},
                "flashcardScore": 0
              }]
        }

        // Render the students list (either from previous data or mock data)
        renderTeacherStudents();

        // Show notification only if we're not using mock data
        if (err.message !== getTranslation('session-expired')) {
            showNotification(getTranslation('fetch-students-error') + ' ' + getTranslation('using-offline-data'), 'warning');
        }
    }
}
function renderTeacherStudents() {
    const list = document.getElementById('teacher-students-list');
    if (!list) return;

    if (!teacherStudents || teacherStudents.length === 0) {
        list.innerHTML = `<p class="placeholder">${getTranslation('no-students')}</p>`;
        return;
    }

    list.innerHTML = `<h4>${getTranslation('students-list')}</h4>
    <ul>
        ${teacherStudents.map(s => `
            <li>
                <img src="${getFullAssetUrl(s.avatar)}" alt="${s.name}" class="rank-avatar small">
                <span>${s.name} (${s.email})</span>
                <button class="view-details-btn action-btn" data-id="${s._id}">${getTranslation('view-details')}</button>
            </li>
        `).join('')}
    </ul>`;

    // Add event listeners to view details buttons
    list.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Get the student ID from the button's data-id attribute
            const studentId = this.getAttribute('data-id');
            if (studentId) {
                fetchStudentDetails(studentId);
            } else {
                console.error('No student ID found on button');
            }
        });
    });

    applyTranslations(list);
}
function clearTeacherStudentsUI() { const list = document.getElementById('teacher-students-list'); if(list) list.innerHTML = ''; const details = document.getElementById('teacher-student-details'); if(details) details.innerHTML = '';}
async function fetchStudentDetails(studentId) {
    if (!currentUser || currentUser.role !== 'teacher' || !studentId) return;
    console.log(`Fetching details for student: ${studentId}`);

    const detailEl = document.getElementById('teacher-student-details');
    if (detailEl) detailEl.innerHTML = `<p class="loading-message">${getTranslation('loading-profile')}</p>`;

    showLoading();

    try {
        // Use the correct teacher API endpoint
        const r = await apiFetch(`/api/teacher/students/${studentId}`);
        const studentData = await r.json();
        renderStudentDetails(studentData);
    } catch (err) {
        console.error(`Fetch student details err ${studentId}:`, err);

        // Mock data for student details
        const mockData = [
            {
                _id: '67cb2333d57fd05d715ba597',
                name: 'Chiến Dev',
                email: 'test@example.com',
                avatar: '/uploads/avatars/avatar_67cb2333d57fd05d715ba597_1744317180.jpg',
                level: 3,
                progress: 57,
                points: 284,
                loginStreak: 5,
                achievements: ['Tân Binh', 'Học Viên Chăm Chỉ'],
                lastLogin: '2025-04-17T09:13:21.555Z',
                createdAt: '2025-03-07T16:47:47.192Z',
                courses: ['Sáo Trúc Cơ Bản', 'Vovinam Nhập Môn']
            },
            {
                _id: '67bf602ca625849aa40f1953',
                name: 'Nguyễn Văn A',
                email: 'student@fpt.edu.vn',
                avatar: 'https://picsum.photos/150',
                level: 1,
                progress: 30,
                points: 50,
                loginStreak: 0,
                achievements: [],
                lastLogin: '2025-02-26T18:40:44.515Z',
                createdAt: '2025-02-26T18:40:44.515Z',
                courses: ['Đàn Tranh Nhập Môn']
            },
            {
                _id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Nguyen Van A',
                email: 'user@example.com',
                avatar: '/uploads/avatars/123e4567-e89b-12d3-a456-426614174000_avatar.jpg',
                level: 1,
                progress: 0,
                points: 0,
                loginStreak: 0,
                achievements: [],
                lastLogin: null,
                createdAt: null,
                courses: []
            },
            {
                _id: '67cc44f590085e1172a29be8',
                name: 'dev',
                email: 'test1@example.com',
                avatar: 'https://picsum.photos/50',
                level: 1,
                progress: 8,
                points: 65,
                loginStreak: 2,
                achievements: ['Tân Binh'],
                lastLogin: '2025-04-15T19:40:41.941Z',
                createdAt: '2025-03-08T13:24:05.630Z',
                courses: ['Đàn Nguyệt Cơ Bản']
            },
            {
                _id: '67fd090d69bd78dd6325bed5',
                name: 'Chiến Test',
                email: 'quangchienaz3@gmail.com',
                avatar: 'https://ui-avatars.com/api/?name=Chien+Test&background=random&color=fff&size=150',
                level: 1,
                progress: 12,
                points: 70,
                loginStreak: 2,
                achievements: ['Tân Binh'],
                lastLogin: '2025-04-15T15:50:50.593Z',
                createdAt: '2025-04-14T13:09:33.338Z',
                courses: ['Sáo Trúc Cơ Bản']
            },
            {
                _id: '67feb9d1ede29e99b22a14ce',
                name: 'Top1 nè',
                email: 'quangchienaz@gmail.com',
                avatar: '/uploads/avatars/avatar_67feb9d1ede29e99b22a14ce_1744748024.jpg',
                level: 1,
                progress: 19,
                points: 87,
                loginStreak: 1,
                achievements: ['Tân Binh'],
                lastLogin: '2025-04-16T09:47:39.466Z',
                createdAt: '2025-04-15T19:56:01.635Z',
                courses: ['Vovinam Nhập Môn']
            },
            {
                _id: '67fff6f3538942ec0f731d58',
                name: 'Tan Phap',
                email: 'letanphap6543@gmail.com',
                avatar: 'https://ui-avatars.com/api/?name=Tan+Phap&background=random&color=fff&size=150',
                level: 1,
                progress: 0,
                points: 0,
                loginStreak: 0,
                achievements: [],
                lastLogin: null,
                createdAt: '2025-04-16T18:29:07.424Z',
                courses: []
            },
            {
                _id: '6800bb4425a865f02762cde5',
                name: 'Học viên',
                email: 'studenttest@fpt.edu.vn',
                avatar: 'https://ui-avatars.com/api/?name=Hoc+vien&background=random&color=fff&size=150',
                level: 1,
                progress: 0,
                points: 0,
                loginStreak: 0,
                achievements: [],
                lastLogin: null,
                createdAt: '2025-04-17T08:26:44.561Z',
                courses: []
            }
        ];

        // Default mock data if student not found
        let mockStudentData = {
            _id: studentId,
            name: 'Unknown Student',
            email: 'unknown@example.com',
            avatar: './assets/images/avatars/default.jpg',
            level: 1,
            progress: 0,
            points: 0,
            loginStreak: 0,
            courses: [],
            achievements: [],
            lastActive: new Date().toISOString(),
            joinDate: new Date().toISOString()
        };

        // Find student in mockData array
        const foundMockStudent = mockData.find(s => s._id === studentId);
        if (foundMockStudent) {
            mockStudentData = {
                ...foundMockStudent,
                lastActive: foundMockStudent.lastLogin || new Date().toISOString(),
                joinDate: foundMockStudent.createdAt || new Date().toISOString()
            };
        }
        // If not found in mockData, try to find in teacherStudents array
        else if (teacherStudents && teacherStudents.length > 0) {
            const foundStudent = teacherStudents.find(s => s._id === studentId);
            if (foundStudent) {
                // Use data from teacherStudents and add mock data for missing fields
                mockStudentData.name = foundStudent.name || mockStudentData.name;
                mockStudentData.email = foundStudent.email || mockStudentData.email;
                mockStudentData.avatar = foundStudent.avatar || mockStudentData.avatar;
                mockStudentData.level = foundStudent.level || mockStudentData.level;
                mockStudentData.progress = foundStudent.progress || mockStudentData.progress;
                mockStudentData.points = foundStudent.points || mockStudentData.points;
                mockStudentData.loginStreak = foundStudent.loginStreak || mockStudentData.loginStreak;
                mockStudentData.achievements = foundStudent.achievements || mockStudentData.achievements;
                mockStudentData.lastActive = foundStudent.lastLogin || mockStudentData.lastActive;
                mockStudentData.joinDate = foundStudent.createdAt || mockStudentData.joinDate;
            }
        }

        // Render with mock data
        renderStudentDetails(mockStudentData);

        // Show notification
        if (err.message !== getTranslation('session-expired')) {
            showNotification(getTranslation('fetch-profile-error') + ' ' + getTranslation('using-offline-data'), 'warning');
        }
    } finally {
        hideLoading();
    }
}
function renderStudentDetails(student) {
    const el = document.getElementById('teacher-student-details');
    if (!el || !student) {
        if(el) el.innerHTML = '';
        return;
    }

    const progress = student.progress || 0;
    const level = student.level || 1;
    const points = student.points || 0;
    const streak = student.loginStreak || 0;
    const courses = student.courses || [];
    const achievements = student.achievements || [];
    const lastActive = student.lastActive ? new Date(student.lastActive).toLocaleString() : 'N/A';
    const joinDate = student.joinDate ? new Date(student.joinDate).toLocaleString() : 'N/A';

    el.innerHTML = `
        <h4>${getTranslation('student-details')}</h4>
        <div class="student-detail-card">
            <div class="student-header">
                <img src="${getFullAssetUrl(student.avatar || 'default-avatar.png')}" alt="${student.name}" class="student-avatar-large">
                <div>
                    <h3>${student.name || 'Unknown Student'}</h3>
                    <p>${student.email || ''}</p>
                </div>
            </div>

            <div class="student-stats">
                <div class="stat-card">
                    <span class="stat-value">${level}</span>
                    <span class="stat-label">${getTranslation('level')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${points}</span>
                    <span class="stat-label">${getTranslation('points')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${streak} ${getTranslation('days')}</span>
                    <span class="stat-label">${getTranslation('streak-text')}</span>
                </div>
            </div>

            <h4>${getTranslation('progress')}: ${progress}%</h4>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>

            <h4>${getTranslation('activity')}</h4>
            <div class="activity-section">
                <p><strong>${getTranslation('last-active')}:</strong> ${lastActive}</p>
                <p><strong>${getTranslation('join-date')}:</strong> ${joinDate}</p>
            </div>

            <h4>${getTranslation('courses')}</h4>
            <div class="courses-section">
                ${courses.length > 0 ?
                    `<ul>${courses.map(course => `<li>${course}</li>`).join('')}</ul>` :
                    `<p class="placeholder">${getTranslation('no-courses')}</p>`
                }
            </div>

            <h4>${getTranslation('achievements')}</h4>
            <div class="achievements-section">
                ${achievements.length > 0 ?
                    `<ul>${achievements.map(achievement => `<li>${achievement}</li>`).join('')}</ul>` :
                    `<p class="placeholder">${getTranslation('no-achievements')}</p>`
                }
            </div>
        </div>
    `;

    // Apply translations
    applyTranslations(el);
}
async function handleUpdateStudentProgress(e) {
    // Get the button element (could be the icon inside the button)
    const button = e.target.closest('.update-progress-btn');
    if (!button) return;

    const id = button.dataset.id;
    const input = document.getElementById(`sp-${id}`);
    const errEl = document.getElementById(`upe-${id}`);
    if (!id || !input || !errEl) return;

    // Clear previous error
    errEl.textContent = '';

    // Validate input
    let prog;
    try {
        prog = parseInt(input.value, 10);
        if (isNaN(prog) || prog < 0 || prog > 100) throw new Error();
    } catch {
        errEl.textContent = 'Giá trị 0-100.';
        return;
    }

    // Disable button while processing
    button.disabled = true;
    button.classList.add('loading');
    showLoading();

    try {
        // Use the correct teacher API endpoint for updating progress
        await apiFetch(`/api/teacher/students/${id}/progress`, {
            method: 'PUT',
            body: JSON.stringify({ progress: prog })
        });

        // Show success notification
        showNotification(getTranslation('progress-updated-success'), 'success');

        // Update student in local data if API call fails in the future
        if (teacherStudents && teacherStudents.length > 0) {
            const studentIndex = teacherStudents.findIndex(s => s._id === id);
            if (studentIndex !== -1) {
                teacherStudents[studentIndex].progress = prog;
            }
        }

        // Refresh student details
        fetchStudentDetails(id);
    } catch (err) {
        console.error(`Update progress err for ${id}:`, err);

        // If it's a CORS or network error, update the local data anyway
        if (err.message === getTranslation('session-expired') ||
            err.message.includes('Failed to fetch')) {

            // Update student in local data
            if (teacherStudents && teacherStudents.length > 0) {
                const studentIndex = teacherStudents.findIndex(s => s._id === id);
                if (studentIndex !== -1) {
                    teacherStudents[studentIndex].progress = prog;

                    // Show offline update notification
                    showNotification(getTranslation('progress-updated-success') + ' ' +
                                    getTranslation('using-offline-data'), 'warning');

                    // Refresh student details with updated data
                    fetchStudentDetails(id);
                    return;
                }
            }
        }

        // Show error message
        errEl.textContent = getTranslation('progress-update-error');
        showNotification(getTranslation('progress-update-error'), 'error');
    } finally {
        // Re-enable button
        button.disabled = false;
        button.classList.remove('loading');
        hideLoading();
    }
}

// --- Chatbot Toggle Function ---
function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    const toggle = document.getElementById('chatbot-toggle');

    if (!chatbot || !toggle) return;

    const isVisible = chatbot.style.display === 'flex';

    if (isVisible) {
        // Hide chatbot
        if (window.anime) {
            anime({
                targets: chatbot,
                opacity: [1, 0],
                translateY: [0, 20],
                scale: [1, 0.95],
                duration: 300,
                easing: 'easeOutQuad',
                complete: () => {
                    chatbot.style.display = 'none';
                    toggle.classList.remove('open');
                }
            });
        } else {
            chatbot.style.display = 'none';
            toggle.classList.remove('open');
        }

        // Stop any ongoing speech or recognition
        if (synthesis?.speaking) synthesis.cancel();
        if (isRecognizing) stopSpeechRecognition();
    } else {
        // Show chatbot
        chatbot.style.display = 'flex';
        toggle.classList.add('open');

        // Initialize chatbot header buttons
        initChatbotHeaderButtons();

        if (window.anime) {
            anime({
                targets: chatbot,
                opacity: [0, 1],
                translateY: [20, 0],
                scale: [0.95, 1],
                duration: 400,
                easing: 'easeOutQuad'
            });
        }

        // Load chat history only if chatbot is empty
        const chatbotBody = document.getElementById('chatbot-body');
        if (chatbotBody && chatbotBody.childElementCount === 0) {
            loadChatHistory();
        }

        // Focus input field
        document.getElementById('chat-input')?.focus();

        // Scroll to bottom of chat
        const chatBody = document.getElementById('chatbot-body');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// Minimize chatbot function removed as per user request

// Initialize chatbot header buttons with proper z-index and event handling
function initChatbotHeaderButtons() {
    // Make sure the header buttons container exists
    const headerButtons = document.querySelector('#chatbot .chatbot-controls');
    if (!headerButtons) return;

    // Add z-index to ensure buttons are clickable
    headerButtons.style.zIndex = '30';

    // Add event listeners to each button
    headerButtons.querySelectorAll('button').forEach(btn => {
        // Remove any existing event listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        // Add new event listener
        newBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const id = this.id;

            // Handle each button based on its ID
            if (id === 'toggle-speech-btn') {
                toggleSpeechOutput();
            } else if (id === 'export-history-btn') {
                exportChatHistory();
            } else if (id === 'clear-cache-btn') {
                clearChatbotCacheAndHistory();
            } else if (id === 'close-chatbot') {
                toggleChatbot();
            }
        });
    });

    // Add event listener to open chatbot button in footer
    const openChatbotBtn = document.getElementById('open-chatbot');
    if (openChatbotBtn) {
        openChatbotBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const chatbot = document.getElementById('chatbot');
            if (chatbot && chatbot.style.display !== 'flex') {
                toggleChatbot();
            }
        });
    }

    console.log('Chatbot header buttons initialized');
}

// Handle profile view click events
function handleProfileViewClick(e) {
    // Check if we clicked on the avatar
    const avatar = e.target.closest('.profile-avatar-container img');
    if (avatar) {
        e.preventDefault();
        e.stopPropagation();
        openAvatarUploadModal();
        return;
    }

    // Check if we clicked on edit profile button
    const editBtn = e.target.closest('.edit-profile-btn');
    if (editBtn) {
        e.preventDefault();
        toggleEditProfile(true);
        return;
    }

    // Check if we clicked on change password button
    const pwdBtn = e.target.closest('.change-password-btn');
    if (pwdBtn) {
        e.preventDefault();
        openChangePasswordModal();
        return;
    }
}

// Open avatar upload modal
function openAvatarUploadModal() {
    if (!currentUser) {
        showNotification(getTranslation('please-login'), 'error');
        return;
    }

    const modal = document.getElementById('avatar-upload-modal');
    if (!modal) return;

    // Reset form
    const form = document.getElementById('avatar-upload-form');
    if (form) form.reset();

    // Set preview to current avatar
    const preview = document.getElementById('avatar-preview');
    if (preview) preview.src = getFullAssetUrl(currentUser.avatar) || './assets/images/placeholder.png';

    // Reset file name display
    const fileName = document.getElementById('avatar-file-name');
    if (fileName) fileName.textContent = getTranslation('no-file-chosen');

    // Show modal with animation
    modal.style.display = 'flex';
    if (window.anime) {
        anime({
            targets: modal.querySelector('.modal-content'),
            opacity: [0, 1],
            translateY: [-20, 0],
            duration: 300,
            easing: 'easeOutQuad'
        });
    }
}

// Close avatar upload modal
function closeAvatarUploadModal() {
    const modal = document.getElementById('avatar-upload-modal');
    if (!modal) return;

    // Hide modal with animation
    if (window.anime) {
        anime({
            targets: modal.querySelector('.modal-content'),
            opacity: [1, 0],
            translateY: [0, -20],
            duration: 300,
            easing: 'easeOutQuad',
            complete: () => {
                modal.style.display = 'none';
            }
        });
    } else {
        modal.style.display = 'none';
    }
}

// Handle avatar file selection
function handleAvatarFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Update file name display
    const fileName = document.getElementById('avatar-file-name');
    if (fileName) fileName.textContent = file.name;

    // Validate file type
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_AVATAR_EXTENSIONS.includes(fileExt)) {
        showNotification(getTranslation('invalid-avatar-type'), 'error');
        return;
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
        showNotification(getTranslation('avatar-too-large'), 'error');
        return;
    }

    // Show preview
    const preview = document.getElementById('avatar-preview');
    if (preview) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// --- Teacher Challenge Actions ---
function setupTeacherChallengeActions() {
    // Update UI based on user role
    function updateTeacherChallengeUI() {
        const actionsContainer = document.getElementById('challenge-teacher-actions');
        if (!actionsContainer) return;

        if (currentUser && currentUser.role === 'teacher') {
            actionsContainer.style.display = 'block';
        } else {
            actionsContainer.style.display = 'none';
        }
    }

    // Add event listener to the teacher dashboard button
    const teacherDashboardBtn = document.getElementById('challenge-teacher-dashboard-btn');
    if (teacherDashboardBtn) {
        teacherDashboardBtn.addEventListener('click', function() {
            // Navigate to teacher dashboard
            showSection('teacher-dashboard');
        });
    }

    // Update UI when user changes
    document.addEventListener('userProfileUpdated', updateTeacherChallengeUI);

    // Initial UI update
    updateTeacherChallengeUI();
}

// --- Final Log ---
console.log("FPT Learning Hub Script Initialized (v3.1 - API Fixes & Teacher Funcs)");

// Course Page JavaScript

document.addEventListener("DOMContentLoaded", function() {
    // Initialize course page functionality when DOM is loaded
    if (typeof initCoursePage === "function") {
        initCoursePage();
    }

    // Observe DOM changes to re-attach event listeners when needed
    observeDOMChanges();
});

// Function to observe DOM changes and re-attach event listeners
function observeDOMChanges() {
    // Create a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Check if new difficulty buttons were added
            if (mutation.addedNodes.length) {
                const addedDifficultyBtns = document.querySelectorAll('.difficulty-btn:not([data-listener="true"])');
                if (addedDifficultyBtns.length > 0) {
                    console.log('New difficulty buttons detected, attaching event listeners');
                    addedDifficultyBtns.forEach(btn => {
                        btn.addEventListener('click', function(e) {
                            console.log('Direct difficulty button click (from observer):', this.dataset.gameType, this.dataset.level);
                            e.stopPropagation();
                            e.preventDefault();

                            if (!currentUser) {
                                showNotification(getTranslation('please-login-game'), 'error');
                                openAuthModal(true);
                                return;
                            }

                            const gameType = this.dataset.gameType;
                            const level = this.dataset.level;
                            startMiniGame(gameType, level);
                        });
                        btn.dataset.listener = 'true'; // Mark as having a listener
                    });
                }
            }
        });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
}

// Mock Mini-Game Response
async function mockMiniGameResponse(endpoint) {
    console.log('Using mock mini-game data for:', endpoint);

    // Extract game type and level from the endpoint
    const params = new URLSearchParams(endpoint.split('?')[1]);
    const gameType = params.get('type');
    const level = params.get('level') || '1';

    // Create mock data based on game type and level
    let mockData;

    // Tạo mảng các câu hỏi cho mỗi level
    const level1Questions = [
        {
            gameId: 'mock-gn001',
            question: 'Nốt nhạc này là gì (tên đầy đủ)?',
            imageUrl: '/assets/images/games/note_do.png',
            gameType: 'guess-note',
            level: 1
        },
        {
            gameId: 'mock-gn002',
            question: 'Nốt nhạc này là gì?',
            imageUrl: '/assets/images/games/note_re.png',
            gameType: 'guess-note',
            level: 1
        },
        {
            gameId: 'mock-gn003',
            question: 'Đây là nốt nhạc gì?',
            imageUrl: '/assets/images/games/note_mi.png',
            gameType: 'guess-note',
            level: 1
        },
        {
            gameId: 'mock-gn004',
            question: 'Nốt nhạc này có tên là gì?',
            imageUrl: '/assets/images/games/note_fa.png',
            gameType: 'guess-note',
            level: 1
        },
        {
            gameId: 'mock-gn005',
            question: 'Đây là nốt nhạc nào?',
            imageUrl: '/assets/images/games/note_sol.png',
            gameType: 'guess-note',
            level: 1
        },
        {
            gameId: 'mock-gn006',
            question: 'Nốt nhạc trong hình là gì?',
            imageUrl: '/assets/images/games/note_la.png',
            gameType: 'guess-note',
            level: 1
        },
        {
            gameId: 'mock-gn007',
            question: 'Bạn có thể cho biết đây là nốt nhạc gì?',
            imageUrl: '/assets/images/games/note_si.png',
            gameType: 'guess-note',
            level: 1
        },
    ];

    const level2Questions = [
        {
            gameId: 'mock-ln001',
            question: 'Nghe âm thanh và đoán nốt nhạc này là gì?',
            audioUrl: '/assets/audio/notes/do.mp3',
            gameType: 'listen-note',
            level: 2
        },
        {
            gameId: 'mock-ln002',
            question: 'Nghe âm thanh và cho biết đây là nốt nhạc nào?',
            audioUrl: '/assets/audio/notes/re.mp3',
            gameType: 'listen-note',
            level: 2
        },
        {
            gameId: 'mock-ln003',
            question: 'Âm thanh này là nốt nhạc gì?',
            audioUrl: '/assets/audio/notes/mi.mp3',
            gameType: 'listen-note',
            level: 2
        },
        {
            gameId: 'mock-ln004',
            question: 'Hãy nghe và cho biết tên nốt nhạc:',
            audioUrl: '/assets/audio/notes/fa.mp3',
            gameType: 'listen-note',
            level: 2
        },
        {
            gameId: 'mock-ln005',
            question: 'Nốt nhạc trong âm thanh này là gì?',
            audioUrl: '/assets/audio/notes/sol.mp3',
            gameType: 'listen-note',
            level: 2
        },
        {
            gameId: 'mock-ln006',
            question: 'Nghe kỹ và đoán tên nốt nhạc:',
            audioUrl: '/assets/audio/notes/la.mp3',
            gameType: 'listen-note',
            level: 2
        },
        {
            gameId: 'mock-ln007',
            question: 'Âm thanh này tương ứng với nốt nhạc nào?',
            audioUrl: '/assets/audio/notes/si.mp3',
            gameType: 'listen-note',
            level: 2
        },
        {
            gameId: 'mock-ln008',
            question: 'Đây là âm thanh của nốt nhạc gì?',
            audioUrl: '/assets/audio/notes/do.mp3',
            gameType: 'listen-note',
            level: 2
        },
        {
            gameId: 'mock-ln009',
            question: 'Nghe và nhận biết nốt nhạc này:',
            audioUrl: '/assets/audio/notes/re.mp3',
            gameType: 'listen-note',
            level: 2
        },
        {
            gameId: 'mock-ln010',
            question: 'Nốt nhạc phát ra trong âm thanh này là gì?',
            audioUrl: '/assets/audio/notes/mi.mp3',
            gameType: 'listen-note',
            level: 2
        }
    ];

    const level3Questions = [
        {
            gameId: 'mock-mn001',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/do.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_do.png', label: 'Đô'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_re.png', label: 'Rê'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_mi.png', label: 'Mi'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_fa.png', label: 'Fa'}
            ]
        },
        {
            gameId: 'mock-mn002',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/re.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_sol.png', label: 'Sol'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_re.png', label: 'Rê'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_la.png', label: 'La'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_si.png', label: 'Si'}
            ]
        },
        {
            gameId: 'mock-mn003',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/mi.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_fa.png', label: 'Fa'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_sol.png', label: 'Sol'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_mi.png', label: 'Mi'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_do.png', label: 'Đô'}
            ]
        },
        {
            gameId: 'mock-mn004',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/fa.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_fa.png', label: 'Fa'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_la.png', label: 'La'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_si.png', label: 'Si'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_re.png', label: 'Rê'}
            ]
        },
        {
            gameId: 'mock-mn005',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/sol.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_mi.png', label: 'Mi'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_sol.png', label: 'Sol'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_do.png', label: 'Đô'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_re.png', label: 'Rê'}
            ]
        },
        {
            gameId: 'mock-mn006',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/la.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_si.png', label: 'Si'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_fa.png', label: 'Fa'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_la.png', label: 'La'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_mi.png', label: 'Mi'}
            ]
        },
        {
            gameId: 'mock-mn007',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/si.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_re.png', label: 'Rê'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_si.png', label: 'Si'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_sol.png', label: 'Sol'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_la.png', label: 'La'}
            ]
        },
        {
            gameId: 'mock-mn008',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/do.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_do.png', label: 'Đô'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_mi.png', label: 'Mi'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_sol.png', label: 'Sol'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_si.png', label: 'Si'}
            ]
        },
        {
            gameId: 'mock-mn009',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/re.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_fa.png', label: 'Fa'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_re.png', label: 'Rê'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_do.png', label: 'Đô'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_la.png', label: 'La'}
            ]
        },
        {
            gameId: 'mock-mn010',
            question: 'Nghe âm thanh và chọn nốt nhạc tương ứng:',
            audioUrl: '/assets/audio/notes/mi.mp3',
            gameType: 'match-note',
            level: 3,
            options: [
                {id: 'opt1', imageUrl: '/assets/images/games/note_la.png', label: 'La'},
                {id: 'opt2', imageUrl: '/assets/images/games/note_si.png', label: 'Si'},
                {id: 'opt3', imageUrl: '/assets/images/games/note_mi.png', label: 'Mi'},
                {id: 'opt4', imageUrl: '/assets/images/games/note_sol.png', label: 'Sol'}
            ]
        }
    ];

    // Chọn câu hỏi ngẫu nhiên dựa trên level
    if (gameType === 'guess-note' || gameType === 'guess-note' && level === '1') {
        // Level 1: Visual note identification
        const randomIndex = Math.floor(Math.random() * level1Questions.length);
        mockData = level1Questions[randomIndex];
    } else if (gameType === 'listen-note' || gameType === 'guess-note' && level === '2') {
        // Level 2: Audio note identification
        const randomIndex = Math.floor(Math.random() * level2Questions.length);
        mockData = level2Questions[randomIndex];
    } else if (gameType === 'match-note' || gameType === 'guess-note' && level === '3') {
        // Level 3: Audio with multiple-choice visual matching
        const randomIndex = Math.floor(Math.random() * level3Questions.length);
        mockData = level3Questions[randomIndex];
    } else if (gameType === 'guess-pose') {
        // Create an array of pose questions
        const poseQuestions = [
            {
                gameId: 'mock-gp001',
                question: 'Thế võ Vovinam này?',
                imageUrl: '/assets/images/games/poses/pose_dontay1.jpg',
                gameType: 'guess-pose'
            },
            {
                gameId: 'mock-gp002',
                question: 'Thế võ này có tên là gì?',
                imageUrl: '/assets/images/games/poses/pose_dontay2.jpg',
                gameType: 'guess-pose'
            },
            {
                gameId: 'mock-gp003',
                question: 'Đây là thế võ nào?',
                imageUrl: '/assets/images/games/poses/pose_dontay3.jpg',
                gameType: 'guess-pose'
            },
            {
                gameId: 'mock-gp004',
                question: 'Bạn có thể cho biết đây là thế võ gì?',
                imageUrl: '/assets/images/games/poses/pose_chemso1.jpg',
                gameType: 'guess-pose'
            },
            {
                gameId: 'mock-gp005',
                question: 'Thế võ trong hình là gì?',
                imageUrl: '/assets/images/games/poses/pose_chemso2.jpg',
                gameType: 'guess-pose'
            }
        ];

        // Select a random pose question
        const randomIndex = Math.floor(Math.random() * poseQuestions.length);
        mockData = poseQuestions[randomIndex];
    } else if (gameType === 'guess-stance') {
        // Create an array of stance questions using the actual images in the stances directory
        const stanceQuestions = [
            {
                gameId: 'mock-gs001',
                question: 'Tên thế tấn này?',
                imageUrl: '/assets/images/games/stances/stance_trungbinhtan.jpg',
                gameType: 'guess-stance'
            },
            {
                gameId: 'mock-gs002',
                question: 'Thế tấn này có tên là gì?',
                imageUrl: '/assets/images/games/stances/stance_chuadinh.jpg',
                gameType: 'guess-stance'
            },
            {
                gameId: 'mock-gs003',
                question: 'Đây là thế tấn nào?',
                imageUrl: '/assets/images/games/stances/stance_xuatan.jpg',
                gameType: 'guess-stance'
            },
            {
                gameId: 'mock-gs004',
                question: 'Bạn có thể cho biết đây là thế tấn gì?',
                imageUrl: '/assets/images/games/stances/stance_laotan.jpg',
                gameType: 'guess-stance'
            },
            {
                gameId: 'mock-gs005',
                question: 'Thế tấn trong hình là gì?',
                imageUrl: '/assets/images/games/stances/stance_quitan.jpg',
                gameType: 'guess-stance'
            },
            {
                gameId: 'mock-gs006',
                question: 'Tên của thế tấn này là?',
                imageUrl: '/assets/images/games/stances/stance_phidaothuongtan.jpg',
                gameType: 'guess-stance'
            },
            {
                gameId: 'mock-gs007',
                question: 'Đây là thế tấn gì trong Vovinam?',
                imageUrl: '/assets/images/games/stances/stance_hactantan.jpg',
                gameType: 'guess-stance'
            },
            {
                gameId: 'mock-gs008',
                question: 'Thế tấn này được gọi là gì?',
                imageUrl: '/assets/images/games/stances/stance_doctan.jpg',
                gameType: 'guess-stance'
            },
            {
                gameId: 'mock-gs009',
                question: 'Tên của thế tấn trong hình?',
                imageUrl: '/assets/images/games/stances/stance_tieutan.jpg',
                gameType: 'guess-stance'
            }
        ];

        // Select a random stance question
        const randomIndex = Math.floor(Math.random() * stanceQuestions.length);
        mockData = stanceQuestions[randomIndex];
    } else {
        // Default mock data
        mockData = {
            gameId: 'mock-default',
            question: 'Câu hỏi mẫu',
            imageUrl: '/assets/images/games/note_do.png',
            gameType: gameType || 'unknown',
            level: parseInt(level) || 1
        };
    }

    return {
        ok: true,
        status: 200,
        json: async () => mockData
    };
}

// Mock Mini-Game Submit Response
async function mockMiniGameSubmitResponse(options) {
    console.log('Using mock mini-game submit response with options:', options);

    let isCorrect = false;
    let correctAnswer = '';
    let pointsAwarded = 0;

    try {
        // Parse the request body to get the user's answer
        const requestData = JSON.parse(options.body);
        const gameId = requestData.gameId;
        const userAnswer = requestData.answer.toLowerCase();

        console.log(`Mock mini-game submit: Game ID ${gameId}, User answer: ${userAnswer}`);

        // Check if the answer is correct based on the game ID
        // Level 1 - Visual note identification
        if (gameId.startsWith('mock-gn')) {
            const noteId = gameId.substring(7);
            const noteNumber = parseInt(noteId);

            // Determine correct answer based on note number
            let correctNoteAnswer = '';
            switch (noteNumber % 7) {
                case 1: case 8: correctNoteAnswer = 'đô'; break;
                case 2: case 9: correctNoteAnswer = 'rê'; break;
                case 3: case 10: correctNoteAnswer = 'mi'; break;
                case 4: correctNoteAnswer = 'fa'; break;
                case 5: correctNoteAnswer = 'sol'; break;
                case 6: correctNoteAnswer = 'la'; break;
                case 0: case 7: correctNoteAnswer = 'si'; break;
            }

            if (userAnswer === correctNoteAnswer) {
                isCorrect = true;
                pointsAwarded = 10;
            }
            correctAnswer = correctNoteAnswer;
        }
        // Level 2 - Audio note identification
        else if (gameId.startsWith('mock-ln')) {
            const noteId = gameId.substring(7);
            const noteNumber = parseInt(noteId);

            // Determine correct answer based on note number
            let correctNoteAnswer = '';
            switch (noteNumber % 7) {
                case 1: case 8: correctNoteAnswer = 'đô'; break;
                case 2: case 9: correctNoteAnswer = 'rê'; break;
                case 3: case 10: correctNoteAnswer = 'mi'; break;
                case 4: correctNoteAnswer = 'fa'; break;
                case 5: correctNoteAnswer = 'sol'; break;
                case 6: correctNoteAnswer = 'la'; break;
                case 0: case 7: correctNoteAnswer = 'si'; break;
            }

            if (userAnswer === correctNoteAnswer) {
                isCorrect = true;
                pointsAwarded = 15;
            }
            correctAnswer = correctNoteAnswer;
        }
        // Level 3 - Multiple choice matching
        else if (gameId.startsWith('mock-mn')) {
            const noteId = gameId.substring(7);
            const noteNumber = parseInt(noteId);

            // Determine correct answer based on note number
            let correctNoteAnswer = '';
            switch (noteNumber % 7) {
                case 1: case 8: correctNoteAnswer = 'đô'; break;
                case 2: case 9: correctNoteAnswer = 'rê'; break;
                case 3: case 10: correctNoteAnswer = 'mi'; break;
                case 4: correctNoteAnswer = 'fa'; break;
                case 5: correctNoteAnswer = 'sol'; break;
                case 6: correctNoteAnswer = 'la'; break;
                case 0: case 7: correctNoteAnswer = 'si'; break;
            }

            if (userAnswer.toLowerCase() === correctNoteAnswer) {
                isCorrect = true;
                pointsAwarded = 20;
            }
            correctAnswer = correctNoteAnswer;
        }
        // Other game types
        else if (gameId.startsWith('mock-gp')) {
            const poseId = gameId.substring(7);
            const poseNumber = parseInt(poseId);

            // Determine correct answer based on pose number
            let correctPoseAnswer = '';
            switch (poseNumber) {
                case 1:
                    correctPoseAnswer = 'đòn tay số 1';
                    if (userAnswer === 'đòn tay số 1' || userAnswer === 'đòn tay 1' || userAnswer === 'don tay 1') {
                        isCorrect = true;
                    }
                    break;
                case 2:
                    correctPoseAnswer = 'đòn tay số 2';
                    if (userAnswer === 'đòn tay số 2' || userAnswer === 'đòn tay 2' || userAnswer === 'don tay 2') {
                        isCorrect = true;
                    }
                    break;
                case 3:
                    correctPoseAnswer = 'đòn tay số 3';
                    if (userAnswer === 'đòn tay số 3' || userAnswer === 'đòn tay 3' || userAnswer === 'don tay 3') {
                        isCorrect = true;
                    }
                    break;
                case 4:
                    correctPoseAnswer = 'chém số 1';
                    if (userAnswer === 'chém số 1' || userAnswer === 'chem so 1') {
                        isCorrect = true;
                    }
                    break;
                case 5:
                    correctPoseAnswer = 'chém số 2';
                    if (userAnswer === 'chém số 2' || userAnswer === 'chem so 2') {
                        isCorrect = true;
                    }
                    break;
                default:
                    correctPoseAnswer = 'đòn tay số 1';
                    if (userAnswer === 'đòn tay số 1' || userAnswer === 'đòn tay 1' || userAnswer === 'don tay 1') {
                        isCorrect = true;
                    }
            }

            if (isCorrect) {
                pointsAwarded = 15;
            }
            correctAnswer = correctPoseAnswer;
        } else if (gameId.startsWith('mock-gs')) {
            const stanceId = gameId.substring(7);
            const stanceNumber = parseInt(stanceId);

            // Determine correct answer based on stance number
            let correctStanceAnswer = '';
            switch (stanceNumber) {
                case 1:
                    correctStanceAnswer = 'trung bình tấn';
                    if (userAnswer === 'trung bình tấn' || userAnswer === 'trung binh tan') {
                        isCorrect = true;
                    }
                    break;
                case 2:
                    correctStanceAnswer = 'thế tấn chữ đinh';
                    if (userAnswer === 'thế tấn chữ đinh' || userAnswer === 'the tan chu dinh' || userAnswer === 'chữ đinh tấn' || userAnswer === 'chu dinh tan') {
                        isCorrect = true;
                    }
                    break;
                case 3:
                    correctStanceAnswer = 'xạ tấn';
                    if (userAnswer === 'xạ tấn' || userAnswer === 'xa tan') {
                        isCorrect = true;
                    }
                    break;
                case 4:
                    correctStanceAnswer = 'lao tấn';
                    if (userAnswer === 'lao tấn' || userAnswer === 'lao tan') {
                        isCorrect = true;
                    }
                    break;
                case 5:
                    correctStanceAnswer = 'quỳ tấn';
                    if (userAnswer === 'quỳ tấn' || userAnswer === 'quy tan') {
                        isCorrect = true;
                    }
                    break;
                case 6:
                    correctStanceAnswer = 'phi đao thượng tấn';
                    if (userAnswer === 'phi đao thượng tấn' || userAnswer === 'phi dao thuong tan') {
                        isCorrect = true;
                    }
                    break;
                case 7:
                    correctStanceAnswer = 'hạc tấn tấn';
                    if (userAnswer === 'hạc tấn tấn' || userAnswer === 'hac tan tan') {
                        isCorrect = true;
                    }
                    break;
                case 8:
                    correctStanceAnswer = 'độc tấn';
                    if (userAnswer === 'độc tấn' || userAnswer === 'doc tan') {
                        isCorrect = true;
                    }
                    break;
                case 9:
                    correctStanceAnswer = 'tiêu tấn';
                    if (userAnswer === 'tiêu tấn' || userAnswer === 'tieu tan') {
                        isCorrect = true;
                    }
                    break;
                default:
                    correctStanceAnswer = 'trung bình tấn';
                    if (userAnswer === 'trung bình tấn' || userAnswer === 'trung binh tan') {
                        isCorrect = true;
                    }
            }

            if (isCorrect) {
                pointsAwarded = 15;
            }
            correctAnswer = correctStanceAnswer;
        } else if (gameId === 'mock-default') {
            // For testing, always mark the default game as correct
            isCorrect = true;
            pointsAwarded = 10;
        }

    } catch (error) {
        console.error('Error parsing mini-game submit request:', error);
    }

    // Create the response data
    const responseData = {
        isCorrect,
        pointsAwarded: isCorrect ? pointsAwarded : 0,
        correctAnswer: !isCorrect ? correctAnswer : undefined
    };

    return {
        ok: true,
        status: 200,
        json: async () => responseData
    };
}
