import { AugSourceEnum } from "@enums/aug-source.enum";
// Base Augment Ids to determine aug source
export const everQuestAugIds = [
51889,
51903,
51907,
51904
];
export const kunarkAugIds = [
46180,
51906,
51908,
51891,
46181
];
export const veliousAugIds = [
51919,
51905
];
export const luclinAugIds = [
51910
];
export const planesAugIds = [
51912,
51911,
51923
];
export const bazaarAugIds = [
51716,
51721,
51726,
51731
];
export const tradeskillAugIds = [
17730
];
export const ykeshaAugIds = [
51892,
51909
];
export const veeshanAugIds = [
41006,
41013,
41020,
41027,
41034,
41041,
41048,
41055,
41062,
41069,
41076,
41083,
41090,
41096,
41102,
41108,
69455,
69456,
69457,
69458,
69459,
69460,
69461
];
export const seruAugIds = [
9536,
9537,
9538,
9539,
9540,
9541,
9542,
9543,
9544,
9545,
9547,
9548
];
export const sleeperAugIds = [
1801,
1802,
9600,
9601,
9602,
9603,
9604,
9605,
9606,
9607,
9608,
9609,
9610,
9611,
9612
];
export const zebAugIds = [
17732,
17733,
17845,
17846,
17847,
18374,
18375,
18376,
18377,
18639,
19053,
24130
];
export const holidayAugIds = [
24133,
24134,
24135,
24136,
24137
];
export const otherAugIds = [

];
    // Determine AugSource based on item name patterns
export const sourceMappings = [
    { source: AugSourceEnum.Veeshans, ids: veeshanAugIds },
    { source: AugSourceEnum.Seru,      ids: seruAugIds },
    { source: AugSourceEnum.Sleepers,  ids: sleeperAugIds },
    { source: AugSourceEnum.Zeb,       ids: zebAugIds },
    { source: AugSourceEnum.Vanilla,       ids: everQuestAugIds },
    { source: AugSourceEnum.Kunark,       ids: kunarkAugIds },
    { source: AugSourceEnum.Velious,       ids: veliousAugIds },
    { source: AugSourceEnum.Luclin,       ids: luclinAugIds },
    { source: AugSourceEnum.Planes,       ids: planesAugIds },
    { source: AugSourceEnum.Ykesha,      ids: ykeshaAugIds },
    { source: AugSourceEnum.Holiday,       ids: holidayAugIds },
    { source: AugSourceEnum.Other,       ids: otherAugIds },
    { source: AugSourceEnum.TradeSkill,       ids: tradeskillAugIds },
    { source: AugSourceEnum.Bazaar,       ids: bazaarAugIds }
    // To add a new source, you just add one line here!
];