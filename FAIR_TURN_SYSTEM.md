# Hệ thống chia turn công bằng

## Mô tả
Hệ thống mới được thiết kế để đảm bảo tính công bằng trong việc chia turn cho nhân viên nail salon.

## Logic hoạt động

### 1. Lần đầu chia turn (First Turn)
- **Điều kiện**: Tất cả nhân viên có history <= 1
- **Cách chia**: 
  - Sắp xếp theo thời gian check-in (sớm nhất trước)
  - Đảo ngược thứ tự để người check-in sớm được xếp cuối
  - Mục đích: Tạo cơ hội công bằng cho tất cả mọi người

### 2. Lần thứ 2 trở đi (Subsequent Turns)
- **Điều kiện**: Có ít nhất 1 nhân viên có history > 1
- **Cách chia**: Sắp xếp theo totalTurn (như logic cũ)

## Các method mới

### `checkIfFirstTurn(activities: Activity[]): Promise<boolean>`
- Kiểm tra xem tất cả nhân viên có history <= 1 hay không
- Trả về `true` nếu đây là lần đầu chia turn

### `sortFirstTurnFairly(activities: Activity[], startOrder: number): Promise<Activity[]>`
- Sắp xếp công bằng cho lần đầu chia turn
- Dựa trên thời gian check-in
- Người check-in sớm sẽ được xếp cuối

### `countByUserId(userId: string): Promise<number>`
- Đếm số lượng history của một user
- Được thêm vào HistoryService

## Ví dụ

### Scenario 1: Lần đầu chia turn
```
Nhân viên A: check-in 8:00, history = 0
Nhân viên B: check-in 8:30, history = 1  
Nhân viên C: check-in 9:00, history = 0

Kết quả sắp xếp:
1. Nhân viên C (check-in muộn nhất)
2. Nhân viên B (check-in giữa)
3. Nhân viên A (check-in sớm nhất)
```

### Scenario 2: Lần thứ 2 trở đi
```
Nhân viên A: totalTurn = 2.5
Nhân viên B: totalTurn = 1.0
Nhân viên C: totalTurn = 3.0

Kết quả sắp xếp (theo totalTurn):
1. Nhân viên B (totalTurn thấp nhất)
2. Nhân viên A (totalTurn giữa)
3. Nhân viên C (totalTurn cao nhất)
```

## Lợi ích
1. **Công bằng**: Lần đầu tất cả mọi người đều có cơ hội
2. **Khuyến khích**: Người check-in sớm không bị thiệt thòi
3. **Linh hoạt**: Từ lần 2 trở đi vẫn dựa trên totalTurn
4. **Minh bạch**: Logic rõ ràng, dễ hiểu
