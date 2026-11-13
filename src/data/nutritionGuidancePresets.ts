import type { NutritionAdviceCategory } from '../services/nutritionAdviceService';

export interface NutritionFoodPreset {
  id: string;
  name: string;
  reason: string;
  portionTip: string;
  category: NutritionAdviceCategory;
  priority: number;
}

export const BP_HIGH_EAT: NutritionFoodPreset[] = [
  {
    id: 'eat-potassium-greens',
    name: 'Rau lá xanh đậm (cải bó xôi, rau dền, bông cải xanh)',
    reason: 'Giàu kali và magie giúp giãn mạch, hỗ trợ hạ huyết áp tự nhiên.',
    portionTip: 'Ăn trước cơm, luộc hoặc hấp nhạt',
    category: 'bp',
    priority: 1,
  },
  {
    id: 'eat-omega-fish',
    name: 'Cá béo hấp gừng (cá hồi, cá thu, cá trích)',
    reason: 'Giàu Omega-3 bảo vệ thành mạch và giảm áp lực tim mạch.',
    portionTip: '100–120g/bữa, không chiên nhiều dầu',
    category: 'bp',
    priority: 2,
  },
  {
    id: 'eat-banana-avocado',
    name: 'Chuối chín vừa, bơ, thanh long hoặc cam tươi',
    reason: 'Bổ sung kali cân bằng natri dư thừa trong cơ thể.',
    portionTip: '1 phần nhỏ vào bữa phụ sáng/chiều',
    category: 'bp',
    priority: 3,
  },
];

export const BP_HIGH_AVOID: NutritionFoodPreset[] = [
  {
    id: 'avoid-high-sodium',
    name: 'Dưa cà muối, mắm nêm, chao, khô cá mặn',
    reason: 'Lượng muối rất cao làm giữ nước và đẩy huyết áp tăng vọt.',
    portionTip: 'Tránh hoàn toàn khi huyết áp đang cao',
    category: 'bp',
    priority: 1,
  },
  {
    id: 'avoid-processed-meat',
    name: 'Giò chả, xúc xích, mì ăn liền, đồ kho quá mặn',
    reason: 'Chứa nhiều muối ẩn và chất bảo quản bất lợi cho tim mạch.',
    portionTip: 'Nêm nhạt dưới 5g muối/ngày',
    category: 'bp',
    priority: 2,
  },
  {
    id: 'avoid-strong-stimulants',
    name: 'Cà phê đậm, trà đặc, rượu bia',
    reason: 'Có thể gây co mạch và làm nhịp tim, huyết áp tăng đột ngột.',
    portionTip: 'Thay bằng nước ấm hoặc trà hoa cúc nhạt',
    category: 'bp',
    priority: 3,
  },
];

export const BP_LOW_EAT: NutritionFoodPreset[] = [
  {
    id: 'eat-warm-soup',
    name: 'Cháo thịt bằm ấm, súp gà gừng, canh rau củ nêm vừa',
    reason: 'Bổ sung nước và điện giải nhẹ nhàng giúp ổn định huyết áp.',
    portionTip: 'Chia làm 4–5 bữa nhỏ trong ngày',
    category: 'bp',
    priority: 1,
  },
  {
    id: 'eat-nuts-raisins',
    name: 'Hạnh nhân, óc chó, nho khô (lượng vừa)',
    reason: 'Cung cấp năng lượng ổn định và vi chất chống mệt mỏi, hoa mắt.',
    portionTip: '1 nắm nhỏ khoảng 20–25g',
    category: 'bp',
    priority: 2,
  },
];

export const BP_LOW_AVOID: NutritionFoodPreset[] = [
  {
    id: 'avoid-skip-meals',
    name: 'Nhịn ăn sáng hoặc để bụng đói quá lâu',
    reason: 'Dễ gây tụt huyết áp tư thế và chóng mặt khi đứng dậy.',
    portionTip: 'Ăn đúng giờ, uống đủ nước ấm',
    category: 'bp',
    priority: 1,
  },
  {
    id: 'avoid-alcohol-low-bp',
    name: 'Rượu bia và đồ uống có cồn',
    reason: 'Gây mất nước và giãn mạch làm huyết áp tụt sâu hơn.',
    portionTip: 'Tránh dùng hàng ngày',
    category: 'bp',
    priority: 2,
  },
];

export const BP_NORMAL_EAT: NutritionFoodPreset[] = [
  {
    id: 'eat-balanced-greens',
    name: 'Rau củ luộc đa màu sắc và cá hấp 2–3 bữa/tuần',
    reason: 'Giúp duy trì thành mạch dẻo dai và giữ huyết áp ổn định.',
    portionTip: 'Ít nhất 300g rau xanh mỗi ngày',
    category: 'bp',
    priority: 4,
  },
];

export const BP_NORMAL_AVOID: NutritionFoodPreset[] = [
  {
    id: 'avoid-excess-salt',
    name: 'Đồ chấm quá mặn, thức ăn nhanh nhiều dầu mỡ',
    reason: 'Phòng ngừa nguy cơ tăng huyết áp âm thầm theo tuổi tác.',
    portionTip: 'Chấm nhẹ tay, ưu tiên món luộc/hấp',
    category: 'bp',
    priority: 4,
  },
];

export const GLU_HYPO_EAT: NutritionFoodPreset[] = [
  {
    id: 'eat-quick-glucose',
    name: 'Nửa ly nước đường ấm, nước cam hoặc 3 viên kẹo ngọt',
    reason: 'Nâng nhanh đường huyết đang xuống thấp dưới 70 mg/dL.',
    portionTip: 'Dùng ngay 15g đường, đo lại sau 15 phút',
    category: 'glucose',
    priority: 1,
  },
  {
    id: 'eat-slow-carb-followup',
    name: 'Cháo yến mạch sữa ít béo hoặc bánh mì nguyên cám',
    reason: 'Giữ đường huyết ổn định bền vững sau khi đã qua cơn hạ đường.',
    portionTip: 'Ăn ngay sau khi đường huyết phục hồi',
    category: 'glucose',
    priority: 2,
  },
];

export const GLU_HYPO_AVOID: NutritionFoodPreset[] = [
  {
    id: 'avoid-fasting-hypo',
    name: 'Bỏ bữa hoặc uống rượu bia khi bụng rỗng',
    reason: 'Làm đường huyết tụt sâu nguy hiểm, dễ choáng váng ngất xỉu.',
    portionTip: 'Luôn mang theo 2–3 viên kẹo dự phòng',
    category: 'glucose',
    priority: 1,
  },
];

export const GLU_HIGH_EAT: NutritionFoodPreset[] = [
  {
    id: 'eat-low-gi-grains',
    name: 'Gạo lứt, yến mạch nguyên hạt, khoai lang luộc vừa phải',
    reason: 'Chỉ số đường huyết (GI) thấp giúp đường máu tăng chậm, không vọt cao.',
    portionTip: '1 chén nhỏ/bữa, kết hợp ăn rau trước',
    category: 'glucose',
    priority: 1,
  },
  {
    id: 'eat-fiber-lean-protein',
    name: 'Đậu phụ, ức gà, cá hấp kèm mướp đắng (khổ qua), đậu bắp',
    reason: 'Chất xơ hòa tan và đạm nạc giúp làm chậm hấp thu đường sau ăn.',
    portionTip: 'Ưu tiên ăn rau và đạm trước tinh bột',
    category: 'glucose',
    priority: 2,
  },
  {
    id: 'eat-low-sugar-fruit',
    name: 'Ổi, bưởi, táo xanh hoặc thanh long (lượng vừa)',
    reason: 'Ít đường, giàu vitamin và chất xơ an toàn cho người cần kiểm soát đường.',
    portionTip: '100–150g giữa các bữa, tránh ép lấy nước',
    category: 'glucose',
    priority: 3,
  },
];

export const GLU_HIGH_AVOID: NutritionFoodPreset[] = [
  {
    id: 'avoid-sugary-refined',
    name: 'Nước ngọt, trà sữa, bánh kẹo, chè và sữa đặc có đường',
    reason: 'Làm đường huyết tăng vọt ngay lập tức và khó kiểm soát.',
    portionTip: 'Tránh dùng hàng ngày, chọn nước lọc/trà nhạt',
    category: 'glucose',
    priority: 1,
  },
  {
    id: 'avoid-white-refined-carbs',
    name: 'Cơm trắng quá nhiều, xôi nếp, bánh mì trắng, bún phở nhiều bánh',
    reason: 'Tinh bột tinh chế hấp thu nhanh làm đường huyết sau ăn tăng cao.',
    portionTip: 'Giảm nửa chén cơm trắng, thay bằng gạo lứt',
    category: 'glucose',
    priority: 2,
  },
  {
    id: 'avoid-sweet-fruits',
    name: 'Sầu riêng, nhãn, vải, xoài chín kỹ và nước ép trái cây ngọt',
    reason: 'Hàm lượng đường fructose cao dù là trái cây tự nhiên.',
    portionTip: 'Hạn chế tối đa khi đường huyết đang cao',
    category: 'glucose',
    priority: 3,
  },
];

export const GLU_NORMAL_EAT: NutritionFoodPreset[] = [
  {
    id: 'eat-steady-fiber',
    name: 'Ngũ cốc nguyên hạt, các loại đậu và rau xanh trước bữa ăn',
    reason: 'Giữ đường huyết ổn định đều đặn cả trước và sau bữa ăn.',
    portionTip: 'Ăn rau trước, cơm sau để no lâu',
    category: 'glucose',
    priority: 4,
  },
];

export const GLU_NORMAL_AVOID: NutritionFoodPreset[] = [
  {
    id: 'avoid-hidden-sugar',
    name: 'Nước ngọt đóng chai, đồ tráng miệng nhiều đường sau bữa tối',
    reason: 'Tránh dao động đường huyết về đêm và giữ cân nặng hợp lý.',
    portionTip: 'Không ăn ngọt sát giờ đi ngủ',
    category: 'glucose',
    priority: 4,
  },
];
