import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type Rice = components["schemas"]["Rice"];

const http = createOpenApiHttp<paths>();

const rices: Rice[] = [
  { id: "1", brand: "コシヒカリ", producer: "魚沼農協", region: "新潟県" },
  { id: "2", brand: "コシヒカリ", producer: "佐渡農協", region: "新潟県" },
  { id: "3", brand: "コシヒカリ", producer: "丹後農協", region: "京都府" },
  { id: "4", brand: "あきたこまち", producer: "大潟村農協", region: "秋田県" },
  { id: "5", brand: "あきたこまち", producer: "横手農協", region: "秋田県" },
  { id: "6", brand: "ひとめぼれ", producer: "JA仙台", region: "宮城県" },
  { id: "7", brand: "ひとめぼれ", producer: "JA岩手", region: "岩手県" },
  { id: "8", brand: "ササニシキ", producer: "JA仙台", region: "宮城県" },
  { id: "9", brand: "つや姫", producer: "JA山形", region: "山形県" },
  { id: "10", brand: "雪若丸", producer: "JA山形", region: "山形県" },
  { id: "11", brand: "ゆめぴりか", producer: "JA北海道", region: "北海道" },
  { id: "12", brand: "ななつぼし", producer: "JA北海道", region: "北海道" },
  { id: "13", brand: "ミルキークイーン", producer: "JA茨城", region: "茨城県" },
  { id: "14", brand: "はえぬき", producer: "JA山形", region: "山形県" },
  { id: "15", brand: "にこまる", producer: "JA熊本", region: "熊本県" },
  { id: "16", brand: "ヒノヒカリ", producer: "JA熊本", region: "熊本県" },
  { id: "17", brand: "ヒノヒカリ", producer: "JA宮崎", region: "宮崎県" },
  { id: "18", brand: "きぬむすめ", producer: "JA鳥取", region: "鳥取県" },
];

export const handlers = [
  http.get("/api/rices", async ({ response }) => {
    await delay(1000);
    return response(200).json(rices);
  }),
];
