# Đặc tả viết kho tri thức Tử Vi Nam Phái

Kho này **tổng hợp lại** kiến thức của 4 cuốn sách ở thư mục gốc của repo, sắp xếp theo khía cạnh của môn Tử Vi. Mục tiêu: một câu hỏi tử vi bất kỳ tìm được đúng **một file nhỏ** trả lời nó, có quy tắc, ví dụ cụ thể và nguồn.

## Nguồn (chỉ dùng 4 cuốn này)

| Mã | Sách | Thư mục | Ghi chú |
|---|---|---|---|
| MLTC | Mệnh Lý Thiên Cơ – Tuyển tập Tử Vi Nam Phái (Lê Quang Lăng) | `Menh-Ly-Thien-Co_Tu-Vi-Nam-Phai/` | Chữ gốc, chính xác. Ch.1 lá số · Ch.2 12 cung · Ch.3 diệu tinh (mỗi sao một file `Chuong-03_Dieu-tinh/02_Tinh-dieu-cac-luan/NNN_*.md`) và tứ hóa · Ch.4 lưu niên/nguyệt/nhật · Ch.5 các bước suy luận, quy tắc phân loại, Thái Tuế nhập quái, xác định giờ sinh |
| NP1 | Tử Vi Nam Phái – Phần 1 (bài giảng) | `Tu-Vi-Nam-Phai_Phan-1/` | OCR: có lỗi chính tả, sửa khi trích nếu chắc chắn. Có 11 lá số mẫu |
| NP2 | Tử Vi Nam Phái – Phần 2 (bài giảng) | `Tu-Vi-Nam-Phai_Phan-2/` | OCR, như trên. Có phần giải lá số |
| TVTH | Tử Vi Thực Hành (Dịch Lý Huyền Cơ) | `Tu-Vi-Thuc-Hanh/` | Chữ gốc. Có an sao, chư tinh, phú đoán cung, đại tiểu hạn, 16 lá số mẫu, phú chữ Hán |

- **Mục lục toàn kho (tên mục + trang + file):** `~/.claude/skills/tu-vi/references/corpus-index.md`.
- **Tóm tắt đã kiểm** (dùng làm điểm xuất phát, không chép nguyên): `~/.claude/skills/tu-vi/references/{an-sao,chinh-tinh,phu-tinh,cach-cuc,cung,han-van}.md`.
- Tìm theo chủ đề trong cả kho: `grep -rn "Cự Môn" . --include='*.md' | grep -v Kien-thuc`.
- Mỗi file nguồn có dòng `> Trang sách a–b` ở đầu.

## Quy tắc nội dung
1. **Chỉ viết điều có trong sách.** Mọi ý phải có nguồn. Kiến thức chung không tìm thấy trong kho thì ghi rõ `(kiến thức phổ thông, chưa thấy trong kho)`, và hạn chế dùng.
2. **Trích nguồn** theo dạng `(MLTC tr.92–139)` hoặc `(TVTH tr.45)`. Dùng trang hoặc khoảng trang của file nguồn. Trích nguyên văn câu phú trong ngoặc kép.
3. **Dị bản:** khi các sách nói khác nhau, ghi cả hai, nói rõ sách nào nói gì. Không tự phân xử nếu không có căn cứ.
4. **Ví dụ cụ thể** là bắt buộc. Ưu tiên lá số mẫu hoặc ví dụ trong sách. Nếu tự dựng tình huống thì ghi "Ví dụ minh họa (tự dựng)" và tính từng bước theo quy tắc trong sách.
5. **Tiếng Việt chuẩn**, có dấu. Tên sao viết hoa từng chữ (Thiên Cơ, Hóa Kỵ). Không dùng chữ Hán.
6. **Mỗi file là một bài toán nhỏ (sub-problem)**, dài khoảng 300–1200 từ. Chủ đề quá dài thì tách thành nhiều file đánh số tiếp. Không viết file rỗng, không viết lan sang chủ đề của file khác; dùng phần "Liên quan" để trỏ sang.
7. **Không phán định mệnh.** Viết như "sách nói…". Hạn chết, bệnh nặng: trình bày như cổ thư, kèm lưu ý.

## Mẫu file (bắt buộc)

```markdown
# <Tiêu đề cụ thể>

> **Phần:** <tên nhánh> › <thư mục con>
> **Trả lời câu hỏi:** "<câu hỏi mẫu 1>" · "<câu hỏi mẫu 2>" · "<câu hỏi mẫu 3>"
> **Từ khóa:** <tên sao, tên cách, tên cung, đồng nghĩa – để grep>
> **Nguồn chính:** MLTC tr.… · TVTH tr.… · NP1/NP2 <file>

## Tóm tắt
2–4 câu trả lời thẳng câu hỏi.

## Nội dung chi tiết
Quy tắc, bảng, phân biệt trường hợp (miếu/hãm, nam/nữ, can tuổi, cung, sao hội…). Mỗi ý có nguồn.

## Ví dụ cụ thể
Ít nhất 1 ví dụ: dữ kiện → áp dụng quy tắc → kết luận, có nguồn.

## Dị bản & lưu ý
(nếu có)

## Liên quan
- [Tên file khác](../đường/dẫn/tương-đối.md)
```

## Quy ước tên
- Thư mục và file: `NN_Ten-khong-dau-noi-gach.md` (hai chữ số, ASCII, gạch ngang). Ví dụ `03_Cuc-va-vi-tri-Tu-Vi.md`.
- Chỉ ghi trong nhánh được giao. Có thể **thêm file hoặc thư mục con** trong nhánh của mình nếu cần, nhưng không đổi tên các mục đã liệt kê dưới đây.
- Link "Liên quan" sang nhánh khác dùng đúng đường dẫn trong cây dưới đây, kể cả khi file đó chưa tồn tại.

## Cây thư mục (khung tối thiểu)

```
01_Du-lieu-lap-la-so/
  01_Gio-sinh/            01_Doi-gio-dong-ho-sang-gio-am · 02_Soat-gio-sinh-va-gio-xau-tre-em · 03_Xac-dinh-lai-gio-sinh
  02_Can-chi-ngu-hanh/    01_Can-chi-am-duong-ngu-hanh · 02_Hop-xung-tam-hop · 03_Nap-am-60-nam
  03_Am-duong-nam-nu/     01_Phan-loai-va-chieu-thuan-nghich
  04_Cuc/                 01_Xac-dinh-cuc · 02_Cuc-va-vi-tri-Tu-Vi · 03_Cuc-va-khoi-dai-van
  05_An-sao/              01_An-Menh-Than-va-12-cung · 02_An-14-chinh-tinh · 03_An-phu-tinh-theo-nam
                          04_An-phu-tinh-theo-thang-ngay-gio · 05_An-cac-vong-sao · 06_An-Tu-hoa-Tuan-Triet
                          07_An-han-va-sao-luu · 08_Vi-du-lap-la-so-tu-dau
02_Ban-menh/
  01_Menh-va-Than/        01_Y-nghia-Menh-va-Than · 02_Than-cu-Menh · 03_Than-cu-Phuc · 04_Than-cu-Quan
                          05_Than-cu-Tai · 06_Than-cu-Di · 07_Than-cu-Phoi
  02_Ngu-hanh-ban-menh/   01_Cuc-sinh-khac-ban-menh · 02_Hanh-cung-Menh-voi-ban-menh · 03_Sinh-vuong-bai-tuyet-dia
  03_Am-duong-ly/         01_Am-duong-thuan-ly-nghich-ly · 02_Mua-sinh-gio-sinh-thuan-nghich
03_Muoi-hai-cung/
  00_Tong-quan-12-cung.md
  01_Cung-Menh/ 02_Cung-Phu-Mau/ 03_Cung-Phuc-Duc/ 04_Cung-Dien-Trach/ 05_Cung-Quan-Loc/ 06_Cung-No-Boc/
  07_Cung-Thien-Di/ 08_Cung-Tat-Ach/ 09_Cung-Tai-Bach/ 10_Cung-Tu-Tuc/ 11_Cung-Phu-The/ 12_Cung-Huynh-De/
     mỗi cung: 01_Y-nghia-va-cach-xem · 02_Chinh-tinh-tai-cung · 03_Phu-tinh-sat-tinh-tai-cung · 04_Phu-doan-va-vi-du
     Cung Phúc Đức thêm: 05_Duc-nang-thang-so-va-vai-tro-trung-tam
04_Chinh-tinh/
  00_Tong-quan/           01_Bon-nhom-chinh-tinh · 02_Do-sang-mieu-vuong-dac-binh-ham · 03_Bang-mieu-ham-14-sao
  01_Tu-Vi/ 02_Thien-Co/ 03_Thai-Duong/ 04_Vu-Khuc/ 05_Thien-Dong/ 06_Liem-Trinh/ 07_Thien-Phu/
  08_Thai-Am/ 09_Tham-Lang/ 10_Cu-Mon/ 11_Thien-Tuong/ 12_Thien-Luong/ 13_That-Sat/ 14_Pha-Quan/
     mỗi sao: 01_Tinh-chat-va-hinh-tuong · 02_Mieu-ham-va-12-vi-tri · 03_Sao-dong-cung-va-cach-cuc
              04_Nam-menh-nu-menh · 05_O-cac-cung-ngoai-Menh · 06_Nhap-han
  15_Menh-vo-chinh-dieu/  01_Nguyen-tac-xem-VCD · 02_Dac-tam-khong · 03_Vi-du-VCD
05_Phu-tinh-sat-tinh-tu-hoa/
  01_Luc-cat-tinh/        01_Ta-Phu-Huu-Bat · 02_Van-Xuong-Van-Khuc · 03_Thien-Khoi-Thien-Viet · 04_Luc-cat-hoi-hop
  02_Luc-sat-tinh/        01_Kinh-Duong · 02_Da-La · 03_Hoa-Tinh-Linh-Tinh · 04_Dia-Khong-Dia-Kiep · 05_Sat-tinh-dac-dia-va-che-hoa
  03_Tu-hoa/              01_Bang-tu-hoa-theo-can · 02_Hoa-Loc · 03_Hoa-Quyen · 04_Hoa-Khoa · 05_Hoa-Ky · 06_Tu-hoa-hoi-hop
  04_Loc-Ton-Thien-Ma/    01_Loc-Ton · 02_Thien-Ma-va-cac-cach-Ma · 03_Loc-Ma-giao-tri-Loc-dao-Ma-dao
  05_Sao-tinh-cam/        01_Dao-Hoa · 02_Hong-Loan-Thien-Hy · 03_Thien-Dieu-Thien-Y · 04_Long-Tri-Phuong-Cac · 05_An-Quang-Thien-Quy
  06_Sao-tinh-cach-khac/  01_Thien-Hinh · 02_Co-Than-Qua-Tu · 03_Thien-Khoc-Thien-Hu · 04_Tam-Thai-Bat-Toa
                          05_Thai-Phu-Phong-Cao · 06_Thien-Quan-Thien-Phuc · 07_Thien-Tai-Thien-Tho · 08_Thien-Khong
                          09_Hoa-Cai-Thien-Duc-Nguyet-Duc-Giai-than · 10_Pha-Toai-Kiep-Sat-Luu-Ha-Thien-Thuong-Thien-Su
                          11_Cac-sao-khac
06_Cac-vong-sao/
  01_Vong-Thai-Tue/       01_Thu-tu-va-y-nghia-12-sao · 02_Bon-bo-tam-hop-trong-vong-Thai-Tue
                          03_Menh-trong-vong-Thai-Tue-va-duoc-thoi · 04_Thai-Tue-nhap-quai
  02_Vong-Bac-Si/         01_Thu-tu-va-y-nghia · 02_Tung-sao-vong-Bac-Si
  03_Vong-Trang-Sinh/     01_Thu-tu-va-y-nghia · 02_Sinh-luc-tung-cung · 03_Tung-sao-vong-Trang-Sinh
07_Tuan-Triet/            01_Ban-chat-Tuan-Triet · 02_Triet-tien-van-Tuan-hau-van · 03_Tuan-Triet-o-Menh-va-cung-chieu
                          04_An-ngu-chinh-tinh-va-sao-ham · 05_Tuan-Triet-luu-nien · 06_Vi-du-Tuan-Triet
08_Quan-he-giua-cac-cung/ 01_Tam-phuong-tu-chinh · 02_Giap-cung-tot · 03_Giap-cung-xau · 04_Ngu-hanh-sao-voi-cung
                          05_Ngu-hanh-sao-voi-ban-menh · 06_Nhi-hop-luc-xung-va-am-hop
09_Cach-cuc/
  00_Nguyen-tac-nhan-dien-cach.md
  01_Cach-tot/            một file mỗi cách (≥ 25 cách). Bắt buộc có: Quan-than-khanh-hoi, Tu-Phu-dong-cung,
                          Phu-Tuong-trieu-vien, Nhat-Nguyet-tinh-minh, Nhat-Nguyet-chieu-bich, Thach-trung-an-ngoc,
                          Ma-dau-doi-kiem, Tham-Vu-dong-hanh, Cu-Co-Mao-Dau, Loc-Ma-giao-tri, Tham-Hoa-Tham-Linh,
                          Sat-Pha-Liem-Tham, Co-Nguyet-Dong-Luong, Cu-Nhat, That-Sat-trieu-dau-nguong-dau,
                          Tam-hoa-lien-chau, Van-que-van-hoa, Minh-loc-am-loc, Tu-linh, Ho-ham-kiem,
                          Chung-thuy-trieu-dong, Tuyet-xu-phung-sinh, Kim-du-phu-gia, Nguyet-lang-thien-mon,
                          Nhat-le-trung-thien
  02_Cach-xau/            một file mỗi cách (≥ 10)
  03_Cach-bi-pha/         cách tốt bị sát tinh, Tuần Triệt, Không Kiếp phá; cách phản vi giai (xấu hóa tốt)
  04_Phan-hang-cach/      phi thường, thượng, trung, hạ; cách theo nghề nghiệp
10_Van-han/
  01_Dai-van/             01_Khoi-va-chieu-dai-van · 02_Doc-mot-dai-van · 03_Nam-dau-Bac-dau-va-5-nam-dau-sau
  02_Tieu-han/            01_An-tieu-han-va-dong-han · 02_Doc-tieu-han · 03_Tuoi-ky-nam-ky
  03_Trung-phung/         01_Dai-tieu-han-trung-phung · 02_Han-gap-cung-tuoi
  04_Luu-nien/            01_Luu-Thai-Tue-Tang-Ho · 02_Luu-Loc-Kinh-Da · 03_Luu-Thien-Ma · 04_Luu-Khoc-Hu
                          05_Tu-hoa-luu-nien · 06_Tuan-Triet-luu · 07_Bang-Thai-Tue-luu-nien-tung-nam
  05_Nguyet-han-nhat-han/ 01_Dau-Quan-va-luu-nguyet · 02_Luu-nhat-luu-thoi · 03_Quy-tac-suy-luan-luu-nguyet-nhat
  06_Tuong-tac-van-va-goc/ 01_Sao-van-gap-sao-goc · 02_Menh-Than-va-han · 03_Chinh-tinh-nhap-han
  07_Han-theo-su-viec/    01_Han-phat-dat · 02_Han-hon-nhan · 03_Han-sinh-con · 04_Han-tang-che · 05_Han-tai-nan-benh-tat
                          06_Han-kien-tung-tu-toi · 07_Han-thi-cu-thang-chuc · 08_Han-tuoi-tho
11_Chu-de-luan/
  01_Tinh-cach/ 02_Hoc-van-cong-danh/ 03_Tai-loc/ 04_Hon-nhan/ 05_Con-cai/ 06_Suc-khoe-benh-tat/
  07_Nha-cua-dat-dai/ 08_Quan-he-xa-hoi/ 09_Xuat-ngoai-di-chuyen/ 10_Tuoi-tho/
     mỗi chủ đề: 01_Cach-xem-cung-va-sao-lien-quan · 02_Bo-sao-tot · 03_Bo-sao-xau · 04_Vi-du
     sức khỏe thêm: 05_Ngu-hanh-tang-phu-va-sao-chu-benh
     tính cách thêm: 05_Hinh-tuong-tuong-mao
12_Nguyen-tac-tong-hop/   01_Xet-tong-the-khong-luan-sao-don-le · 02_Trinh-tu-luan-mot-la-so · 03_Ket-hop-hoan-canh-thuc-te
                          04_Duc-nang-thang-so · 05_Di-ban-va-do-tin-cay-giua-cac-sach · 06_Cac-quy-tac-phan-loai-nguoi-su-viec-vat
13_La-so-mau/             mỗi lá số mẫu trong sách một file: dữ kiện, an sao chính, cách cục, luận Mệnh/Thân,
                          luận theo cung và hạn, bài học rút ra, link đến các file quy tắc đã dùng
```

## Khi xong
Báo lại: danh sách file đã viết, số file, các chỗ còn thiếu tài liệu, và các dị bản quan trọng phát hiện được.
