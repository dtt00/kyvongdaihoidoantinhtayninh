$(document).ready(function () {
    let cropper;

    // --- Khai báo các biến ---
    const $imageChoose = $("#image-choose");
    const $imgChoosen = $("#img-choosen");
    const $cropperImage = $("#cropperImage");
    const $cropperModal = $("#cropperModal");
    const $saveCroppedImage = $("#saveCroppedImage");
    const $closeModal = $(".close");

    // Các biến cho Modal kết quả
    const $resultModal = $("#resultModal");
    const $closeResultBtn = $("#closeResultBtn");

    // --- Hàm reset input file ---
    function resetInput() {
        $imageChoose.val("");
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }

    // --- 1. Xử lý chọn và crop ảnh ---
    $imageChoose.on("change", function () {
        const files = this.files;
        if (files.length > 0) {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chỉ chọn file ảnh!');
                return;
            }
            const reader = new FileReader();
            reader.onload = function (event) {
                $cropperImage.attr("src", event.target.result);
                $cropperModal.fadeIn();
                if (cropper) cropper.destroy();
                
                cropper = new Cropper($cropperImage[0], {
                    aspectRatio: 1, 
                    viewMode: 1,    
                    autoCropArea: 0.9,
                    movable: true,
                    zoomable: true,
                    rotatable: false,
                    scalable: false,
                });
            };
            reader.readAsDataURL(file);
        }
    });

    // Lưu ảnh crop
    $saveCroppedImage.on("click", function () {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({
                width: 1200, // Tăng chất lượng ảnh avatar lên chút
                height: 1200,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });
            
            if(canvas) {
                const base64encodedImage = canvas.toDataURL("image/jpeg", 0.95);
                $imgChoosen.attr("src", base64encodedImage);
            }
            
            $cropperModal.fadeOut();
            resetInput();
        }
    });

    // Đóng modal crop
    $closeModal.on("click", function () {
        $cropperModal.fadeOut();
        resetInput();
    });

    $(window).on("click", function (event) {
        if (event.target === $cropperModal[0]) {
            $cropperModal.fadeOut();
            resetInput();
        }
    });

    // --- 2. Cập nhật nội dung text ---
    $("#name").on("input", function () {
        $(".name-content").text($(this).val());
    });
    $("#title").on("input", function () {
        $(".title-content").text($(this).val());
    });
    // Sử dụng val() thay vì text() nếu input là textarea, 
    // và gán vào div hiển thị (nếu bạn dùng div để hiển thị chữ trên ảnh)
    $("#message").on("input", function () {
        $(".message-content").text($(this).val());
    });


    // --- 3. XUẤT ẢNH VÀ TỰ ĐỘNG TẢI XUỐNG (ĐÃ SỬA LỖI NHẢY CHỮ) ---
    $("#submit").click(function () {
        const $btn = $(this);
        const originalText = $btn.text();
        
        // Hiển thị loading
        if($(".loader-wrapper").length) {
            $(".loader-wrapper").fadeIn();
        } else {
            $btn.text("Đang tạo ảnh...").prop("disabled", true);
        }

        const node = document.getElementById("frame-wrapper");

        // --- CẤU HÌNH FIX LỖI ---
        // Lấy kích thước thực tế của phần tử
        const width = node.scrollWidth;
        const height = node.scrollHeight;
        
        // Thiết lập scale cố định (3 là đủ nét cho in ấn cơ bản/mạng xã hội)
        // Đừng dùng dynamicScale dựa trên màn hình mobile, nó sẽ gây vỡ layout
        const scale = 3; 

        html2canvas(node, {
            width: width,
            height: height,
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null, // Để nền trong suốt nếu CSS không đặt màu
            
            // --- FIX LỖI QUAN TRỌNG NHẤT: SCROLL ---
            // Dòng này giúp html2canvas không bị lệch khi người dùng đã cuộn trang
            scrollY: -window.scrollY, 
            scrollX: 0,
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight,

            onclone: (clonedDoc) => {
                const clonedNode = clonedDoc.getElementById("frame-wrapper");
                
                // Đảm bảo node copy hiển thị đầy đủ, không bị hidden
                clonedNode.style.display = "block";
                
                // Tìm các phần tử text để cố định style
                const textElements = clonedNode.querySelectorAll('.name-content, .title-content, .message-content');
                
                textElements.forEach(el => {
                    // 1. Reset transform: Xóa bỏ mọi dịch chuyển cũ gây lỗi
                    el.style.transform = "none"; 
                    el.style.margin = "0"; 
                    
                    // 2. Cố định line-height: Giúp chữ không bị nhảy dòng
                    el.style.lineHeight = "1.2"; 
                    
                    // 3. Ép font-family: Đảm bảo không bị lỗi font fallback
                    const computedStyle = window.getComputedStyle(el);
                    el.style.fontFamily = computedStyle.fontFamily;
                    el.style.fontSize = computedStyle.fontSize; // Giữ nguyên size gốc (sẽ được nhân với scale tự động)
                    el.style.fontWeight = computedStyle.fontWeight;

                    // 4. Fix lỗi cho iPhone/Safari (Text size adjust)
                    el.style.webkitTextSizeAdjust = "100%"; 
                });
                
                // Fix lỗi ảnh avatar bị mờ hoặc lệch (nếu có)
                const img = clonedNode.querySelector('#img-choosen');
                if(img) {
                    img.style.transform = "none";
                }
            }
        }).then(canvas => {
            // Tải xuống
            try {
                const finalImgDataUrl = canvas.toDataURL("image/png", 1.0);
                const link = document.createElement('a');
                link.href = finalImgDataUrl;
                link.download = 'DaiHoiDoanTNCSHCM.png'; 
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) {
                console.error("Lỗi download:", e);
                alert("Không thể tải ảnh. Hãy thử nhấn giữ vào ảnh để lưu thủ công (nếu dùng điện thoại).");
            }

            // Ẩn loading
            if($(".loader-wrapper").length) {
                $(".loader-wrapper").fadeOut();
            } else {
                $btn.text(originalText).prop("disabled", false);
            }

        }).catch(err => {
            console.error("Lỗi html2canvas:", err);
            alert("Có lỗi khi tạo ảnh. Vui lòng thử lại!");
            if($(".loader-wrapper").length) {
                $(".loader-wrapper").fadeOut();
            } else {
                $btn.text(originalText).prop("disabled", false);
            }
        });
    });

    // Đóng Modal Kết quả (nếu dùng sau này)
    $closeResultBtn.on("click", function() {
        $resultModal.fadeOut();
    });
    
    $(window).on("click", function (event) {
        if (event.target === $resultModal[0]) {
            $resultModal.fadeOut();
        }
    });
});
