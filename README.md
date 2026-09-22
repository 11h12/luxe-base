# Luxe Extension (Compiled Version)

## 🎯 Tổng quan
Thư mục này chứa bản **pre-compiled (build tĩnh)** và frontend Vite của Luxe Extension. Extension là New Tab thay thế trên Chrome; backend là tùy chọn và có thể được cấu hình cho local hoặc Vercel mà không làm mất dữ liệu offline.

## API và offline cache

- Chỉ cấu hình API trong [src/config/api.ts](C:/Users/Duong/Documents/GitHub/luxe-base/src/config/api.ts). Component không được hardcode origin hay `/api`.
- Development mặc định dùng `http://localhost:3000/api`.
- Production dùng `VITE_API_BASE_URL`; copy `.env.example` thành `.env` và đặt, ví dụ, `https://your-project.vercel.app/api`.
- [src/data/apiClient.ts](C:/Users/Duong/Documents/GitHub/luxe-base/src/data/apiClient.ts) chỉ ghi đè cache khi API trả về thành công. Timeout, 404, lỗi server và offline đều giữ nguyên IndexedDB/localStorage hiện có.
- [src/data/indexedDb.ts](C:/Users/Duong/Documents/GitHub/luxe-base/src/data/indexedDb.ts) dùng database `luxe_offline_cache`, store `resources`. Không có đường code nào xóa cache khi sync thất bại.

Khi thêm một resource mới (photos, tasks, favorites...), gọi `syncWithCache({ cacheKey, localStorageKey, fallback, fetcher })`. Không đặt `[]` vào state/cache bên trong `catch`.

*Lưu ý: Extension cũ đã được gỡ bỏ hoàn toàn khỏi kiến trúc và không còn được sử dụng hay duy trì.*

## 🛠 Core Patches (Các bản vá cốt lõi)
Vì thư mục này chỉ chứa các file đã được minify (.js chunk), source code gốc không nằm ở repo này. Các tính năng mở rộng/vá lỗi được tiêm trực tiếp vào file chunk đã build (hiện tại là `apps/extension/next/static/chunks/1bd8a6f1e7c95853.js`) thông qua script `fix_extension.sh`.

Dưới đây là 4 bản vá quan trọng đang được áp dụng:

### 1. Fix lỗi Click đúp (Task Completion)
- **Nguyên nhân:** Khối bọc ngoài của Task sử dụng thẻ `<label>`, gây ra hiện tượng focus và trigger event loạn khi double-click.
- **Cách Fix:** Thay thế `<label>` bằng thẻ `<p>`, giữ nguyên các hàm `onDoubleClick`.

### 2. Fix lỗi kẹt State ngôn ngữ (VN/US)
- **Nguyên nhân:** Khi chuyển đổi ngôn ngữ, dữ liệu quote/mantras cũ bị kẹt trong IndexedDB/localStorage, dẫn đến việc đổi ngôn ngữ không ăn lập tức.
- **Cách Fix:** Gắn thêm logic vào nút bấm đổi ngôn ngữ (onClick). Trước khi set locale mới, tự động `localStorage.removeItem("dbindex_mantras")` và `"dbindex_quotes"` để ép hệ thống seed lại dữ liệu mới đúng ngôn ngữ.

### 3. Tính năng Show Completed Tasks (Ẩn/hiện task đã xong)
- **Nguyên nhân:** UI mặc định không cho phép bật/tắt hiển thị các task đã check done.
- **Cách Fix:**
  - Bơm state `showCompletedTasks` vào component gốc.
  - Chèn nút toggle UI vào header của list Task.
  - Thay đổi logic render: Nếu `showCompletedTasks` là false, sử dụng `.filter(e=>"done"!==e.status)`, nếu true thì render toàn bộ mảng.

### 4. Bổ sung nút Disconnect cho Lark Integration
- **Nguyên nhân:** Giao diện kết nối Lark chỉ có nút Connect/Mapping, không có cách nào gỡ liên kết nếu đã lỡ kết nối.
- **Cách Fix:** Tiêm logic kiểm tra trạng thái kết nối. Nếu đã kết nối, render nút "Disconnect". Khi click, gọi endpoint cấu hình `/lark/base/disconnect`, xóa key `lark_connected` trong localStorage và tự động reload trang; nếu offline vẫn luôn xóa trạng thái cục bộ an toàn.

## 🚨 Quy trình cập nhật (Maintenance Workflow)
Nếu có bản cập nhật mới cho extension từ source gốc:
1. Xóa nội dung cũ trong `apps/extension/` và dán bản build mới vào.
2. Kiểm tra tên file chunk chứa code logic UI (tên hash như `1bd8a6f1e7c95853.js` sẽ bị thay đổi).
3. Mở file `fix_extension.sh`, cập nhật lại tên file chunk mới.
4. **BẮT BUỘC:** Chạy lệnh `bash fix_extension.sh` để ép lại 4 bản vá trên vào extension.
5. Vào Chrome Extension reload lại unpacked folder để kiểm tra.
