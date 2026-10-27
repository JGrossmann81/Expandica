// Bare-bones site cost model. All numbers sourced; null = not found. See SOURCES-barebones.md
window.EXB_BARE = {
 "asof": "2026-10",
 "method": "Search then read each URL listed; record only figures printed on the page. Retail items are prices on a seller or news page about seller prices; guide items are cost-guide averages. Null where nothing was found.",
 "items": [
  {
   "id": "car_battery_flooded",
   "label": "Car battery, standard flooded lead-acid (battery only, no tax or core deposit)",
   "unit": "USD each",
   "low": 119.99,
   "high": 219.99,
   "src": "https://axis-intelligence.com/?p=43549",
   "asof": "2026-10",
   "kind": "guide",
   "note": "Price research page, 34 AutoZone and Walmart listings (median 159.84), verified 2026-10-01. A starting battery is built to start an engine, not to be drained daily; deep-cycle types last longer on solar."
  },
  {
   "id": "car_battery_agm",
   "label": "Car battery, AGM (battery only)",
   "unit": "USD each",
   "low": 189,
   "high": 289.99,
   "src": "https://axis-intelligence.com/?p=43549",
   "asof": "2026-10",
   "kind": "guide",
   "note": "Same price research page, 12 AutoZone and Walmart listings (median 224.50)."
  },
  {
   "id": "deepcycle_agm_24m",
   "label": "Deep-cycle AGM marine/RV battery, group 24M (amp-hours not stated on the listing)",
   "unit": "USD each",
   "low": 159.97,
   "high": 159.97,
   "src": "https://www.walmart.com/c/kp/deep-cycle",
   "asof": "2026-10",
   "kind": "retail",
   "note": "Walmart category page listing. Capacity is not printed on the listing, so check the label."
  },
  {
   "id": "inverter_1000_psw",
   "label": "Inverter, 1000 W pure sine, 12 V",
   "unit": "USD each",
   "low": 379,
   "high": 379,
   "src": "https://invertersrus.com/product/powerbright-aps1000-12/",
   "asof": "2026-02",
   "kind": "retail",
   "note": "One retailer listing (marked down from 419, shown out of stock). No cheaper inverter price was read, so cheaper ones may exist. Battery cables, fuses and a battery box: no price found."
  },
  {
   "id": "rmx_yd_guide_a",
   "label": "Ready-mix concrete, typical homeowner range (cost guide A)",
   "unit": "USD per cubic yard",
   "low": 119,
   "high": 147,
   "src": "https://homeserve.com/en-us/blog/cost-guide/pouring-concrete",
   "asof": "2025-02",
   "kind": "guide",
   "note": "Guide published 2025-02-18; says average about 108. Delivery within 20 mi is included in its truckload price."
  },
  {
   "id": "rmx_yd_guide_b",
   "label": "Ready-mix concrete, 3000 psi, supplier price lists and trade-site range (cost guide B)",
   "unit": "USD per cubic yard",
   "low": 148,
   "high": 195,
   "src": "https://www.thepricer.org/concrete-delivery-cost/",
   "asof": "2026-07",
   "kind": "guide",
   "note": "Low is one Nebraska supplier list (eff. 2026-01), high is the top of a trade-site range (2026-07). Georgia list 174 (2026-04), California list 162 (undated) fall between."
  },
  {
   "id": "rmx_yd_guide_c",
   "label": "Ready-mix concrete, single figure (cost guide C)",
   "unit": "USD per cubic yard",
   "low": 110,
   "high": 110,
   "src": "https://www.angi.com/articles/concrete-slab-cost.htm",
   "asof": "2026-04",
   "kind": "guide",
   "note": "Single average, not a range. Article updated 2026-04-16."
  },
  {
   "id": "short_load_a",
   "label": "Short-load surcharge, typical (cost guide)",
   "unit": "USD per cubic yard extra",
   "low": 40,
   "high": 60,
   "src": "https://www.thepricer.org/concrete-delivery-cost/",
   "asof": "2026-09",
   "kind": "guide",
   "note": "Trade-site summary of a delivery study, for loads well under a full truck."
  },
  {
   "id": "short_load_b",
   "label": "Short-load surcharge, load under 10 yd (cost guide)",
   "unit": "USD per cubic yard extra",
   "low": 53,
   "high": 53,
   "src": "https://homeserve.com/en-us/blog/cost-guide/pouring-concrete",
   "asof": "2025-02",
   "kind": "guide",
   "note": "Single figure. Same guide says a standard truck holds about 10 yd."
  },
  {
   "id": "short_load_c",
   "label": "Short-load surcharge, one supplier, loads under 4 yd",
   "unit": "USD per load",
   "low": 50,
   "high": 50,
   "src": "https://www.thepricer.org/concrete-delivery-cost/",
   "asof": "2026-01",
   "kind": "guide",
   "note": "One Nebraska supplier price list, flat fee per load. Shows practice varies: flat fee vs per-yard."
  },
  {
   "id": "min_order_cod",
   "label": "Minimum order, one supplier, cash-on-delivery orders of 4 yd or less",
   "unit": "USD per order",
   "low": 820,
   "high": 820,
   "src": "https://www.thepricer.org/concrete-delivery-cost/",
   "asof": "2026-04",
   "kind": "guide",
   "note": "One Georgia supplier list. Many suppliers set minimums; ask yours."
  },
  {
   "id": "delivery_fee",
   "label": "Truck delivery fee, supplier lists",
   "unit": "USD per delivery",
   "low": 85,
   "high": 350,
   "src": "https://www.thepricer.org/concrete-delivery-cost/",
   "asof": "2026-04",
   "kind": "guide",
   "note": "Low: GA supplier under 6 yd; high: far zone of a CA supplier (undated). Extra miles beyond about 20 mi billed per mile at some suppliers."
  },
  {
   "id": "slab_pro_shed",
   "label": "Installed slab, garage or shed foundation, contractor (materials plus labor)",
   "unit": "USD per sq ft",
   "low": 6,
   "high": 12,
   "src": "https://homeserve.com/en-us/blog/cost-guide/pouring-concrete",
   "asof": "2025-02",
   "kind": "guide",
   "note": "Cost guide figure; includes labor."
  },
  {
   "id": "slab_pro_angi",
   "label": "Installed slab, contractor, average",
   "unit": "USD per sq ft",
   "low": 4,
   "high": 8,
   "src": "https://www.angi.com/articles/concrete-slab-cost.htm",
   "asof": "2026-04",
   "kind": "guide",
   "note": "Angi says thin slabs can be as low as 4 and thick foundations up to 18. Small jobs often price above these per-sq-ft figures (minimum job charges); not sourced."
  },
  {
   "id": "slab_materials_only",
   "label": "Concrete material only, no labor",
   "unit": "USD per sq ft",
   "low": 3,
   "high": 7,
   "src": "https://homeserve.com/en-us/blog/cost-guide/pouring-concrete",
   "asof": "2025-02",
   "kind": "guide",
   "note": "Cost guide figure. This is the nearest sourced DIY-material number for a hired truck pour."
  },
  {
   "id": "slab_diy_saving",
   "label": "Labor saved by doing the pour yourself",
   "unit": "USD per sq ft saved",
   "low": 2,
   "high": 3,
   "src": "https://www.angi.com/articles/concrete-slab-cost.htm",
   "asof": "2026-04",
   "kind": "guide",
   "note": "Not a DIY total price; subtract from contractor figure. No source gave a DIY installed total."
  },
  {
   "id": "bag_concrete",
   "label": "Bagged concrete mix, 80 lb bag",
   "unit": "USD per bag",
   "low": 6,
   "high": 6,
   "src": "https://homeserve.com/en-us/blog/cost-guide/pouring-concrete",
   "asof": "2025-02",
   "kind": "guide",
   "note": "Guide says about 45 bags per cubic yard (about 270 USD per yd). Single figure, not a range; check retailer."
  },
  {
   "id": "rebar",
   "label": "Rebar reinforcement",
   "unit": "USD per sq ft",
   "low": 0.5,
   "high": 1,
   "src": "https://www.angi.com/articles/concrete-slab-cost.htm",
   "asof": "2026-04",
   "kind": "guide",
   "note": "Add-on to slab cost."
  },
  {
   "id": "fiber_mesh",
   "label": "Fiber mesh reinforcement",
   "unit": "USD per sq ft",
   "low": 2,
   "high": 3,
   "src": "https://www.angi.com/articles/concrete-slab-cost.htm",
   "asof": "2026-04",
   "kind": "guide",
   "note": "Add-on as stated by guide; looks high versus wire mesh, verify locally."
  },
  {
   "id": "gravel_base",
   "label": "Gravel base",
   "unit": "USD per sq ft or ton",
   "low": null,
   "high": null,
   "src": null,
   "asof": null,
   "kind": "guide",
   "note": "No source found that gives a price. Ask a local yard."
  },
  {
   "id": "form_lumber",
   "label": "Form lumber",
   "unit": "USD",
   "low": null,
   "high": null,
   "src": null,
   "asof": null,
   "kind": "guide",
   "note": "No source found that gives a price."
  },
  {
   "id": "shed_wood_kit_10x12_a",
   "label": "Wood shed kit, 10x12, no floor, curbside delivery",
   "unit": "USD each",
   "low": 3499.99,
   "high": 3499.99,
   "src": "https://www.tractorsupply.com/tsc/product/shed-master-12-ft-x-10-ft-premium-wood-storage-shed-with-large-windows-2244913",
   "asof": "2026-10",
   "kind": "retail",
   "note": "Retailer page: pre-cut DIY kit, 7 ft sidewalls, floor not included; big-and-bulky handling fee applies; no install offered."
  },
  {
   "id": "shed_wood_kit_10x12_b",
   "label": "Wood shed kit, 10x12, with floor option, free delivery",
   "unit": "USD each",
   "low": 2984.86,
   "high": 2984.86,
   "src": "https://www.wayfair.com/-/pdp/-GCCT1011.html",
   "asof": "2026-10",
   "kind": "retail",
   "note": "Marketplace page sale price (regular 3997). Page contradicts itself on whether floor is included. Professional install offered, price not shown."
  },
  {
   "id": "shed_wood_10x12_dealer",
   "label": "Wood shed, 10x12, built/delivered by local dealer",
   "unit": "USD each",
   "low": 4266,
   "high": 5046,
   "src": "https://pinecreekstructures.com/sheds/madison-series-sheds-economy-line/madison-peak-sheds/10x12-madison-peak-shed-in-ct",
   "asof": "2026-10",
   "kind": "retail",
   "note": "Dealer page: base 4266, 5046 with chosen options; free delivery within 20 mi; install fee not listed. State-specific dealer."
  },
  {
   "id": "shed_resin_10x8",
   "label": "Resin/steel-reinforced plastic shed, 10x8",
   "unit": "USD each",
   "low": 1599,
   "high": 1599,
   "src": "https://www.samsclub.com/ip/Lifetime-10-x-8-Outdoor-Storage-Shed-Gray/13594774228",
   "asof": "2026-10",
   "kind": "retail",
   "note": "Warehouse-club page; delivery terms not shown; needs a flat level base (foundation kit sold separately)."
  },
  {
   "id": "shed_8x10_guide",
   "label": "Shed 8x10 by material, guide ranges (bare metal about 300, basic resin about 800, basic wood about 2000)",
   "unit": "USD each",
   "low": 300,
   "high": 2000,
   "src": "https://plasticinehouse.com/storage-shed-prices/",
   "asof": "2026-10",
   "kind": "guide",
   "note": "Page undated, asof is the month read (footer 2026). Metal low end is bare-bones galvanized."
  },
  {
   "id": "shed_12x16_wood_guide",
   "label": "Wood shed 12x16, standard average",
   "unit": "USD each",
   "low": 3700,
   "high": 3700,
   "src": "https://plasticinehouse.com/storage-shed-prices/",
   "asof": "2026-10",
   "kind": "guide",
   "note": "Page undated, asof is month read; single average. No retailer 12x16 page read."
  },
  {
   "id": "shed_delivery_assembly",
   "label": "Shed delivery and assembly fee practice",
   "unit": "USD",
   "low": null,
   "high": null,
   "src": null,
   "asof": null,
   "kind": "retail",
   "note": "Seen: curbside delivery included or free within about 20 mi; some add handling fee; assembly by buyer or optional paid install. No fee amounts found."
  },
  {
   "id": "solar_kit_200w",
   "label": "Solar kit 200 W (2x100 W rigid panels, 30 A PWM controller, Z brackets, MC4 leads)",
   "unit": "USD each",
   "low": 255.14,
   "high": 255.14,
   "src": "https://www.fridayparts.com/100w-12v-monocrystalline-solar-panel-kit-with-20a-pwm-charge-controller-z-brackets-mc4-cables-23-high-efficiency-ip65-weather-resistant-for-rv-boat-cabin-off-grid-battery-system?1613=747",
   "asof": "2026-10",
   "kind": "retail",
   "note": "Retailer listing. Page title/metadata mismatch (100 W / 20 A) so confirm model. PWM controllers are cheaper but less efficient than MPPT."
  },
  {
   "id": "solar_panel_100w_alone",
   "label": "Solar panel 100 W alone",
   "unit": "USD each",
   "low": null,
   "high": null,
   "src": null,
   "asof": null,
   "kind": "retail",
   "note": "Not separately read; derive from kit only with caution."
  },
  {
   "id": "solar_cables_controller_sep",
   "label": "Separate charge controller and cables",
   "unit": "USD",
   "low": null,
   "high": null,
   "src": null,
   "asof": null,
   "kind": "retail",
   "note": "Not found separately; included in the kit above."
  },
  {
   "id": "ps_500",
   "label": "Portable power station about 500 Wh (512 Wh unit)",
   "unit": "USD each",
   "low": 319,
   "high": 449,
   "src": "https://9to5toys.com/2026/06/11/jackery-512wh-explorer-500-v2-power-station-319/",
   "asof": "2026-06",
   "kind": "retail",
   "note": "Low is a past Amazon sale, high is the maker direct full price. News article about retail pricing; sale had expired."
  },
  {
   "id": "ps_1000_bundle",
   "label": "Portable power station about 1000 Wh (1070 Wh) with 200 W panel bundle",
   "unit": "USD per bundle",
   "low": 699,
   "high": 1299,
   "src": "https://gizmodo.com/jackery-explorer-1000-v2-with-200w-solar-panel-drops-nearly-50-turning-a-power-station-into-a-full-solar-generator-setup-for-less-2000784442",
   "asof": "2026-07",
   "kind": "retail",
   "note": "Low is sale bundle price, high is regular price (as reported in article)."
  },
  {
   "id": "ps_2000",
   "label": "Portable power station about 2000 Wh, no panel",
   "unit": "USD each",
   "low": 649.99,
   "high": 1199.99,
   "src": "https://www.slashgear.com/2250694/anker-solix-2kwh-power-station-amazon-deal/",
   "asof": "2026-09",
   "kind": "retail",
   "note": "Low sale, high MSRP, as reported in article dated 2026-09-03."
  },
  {
   "id": "ps_500_panel_bundle",
   "label": "500 Wh unit with panel bundle",
   "unit": "USD per bundle",
   "low": null,
   "high": null,
   "src": null,
   "asof": null,
   "kind": "retail",
   "note": "Not found."
  },
  {
   "id": "ps_1000_alone",
   "label": "1000 Wh unit without panel",
   "unit": "USD each",
   "low": null,
   "high": null,
   "src": null,
   "asof": null,
   "kind": "retail",
   "note": "Not found; only bundle price read."
  }
 ],
 "slabs": [
  {
   "size": "8x10 ft",
   "thicknessIn": 4,
   "cuYd": 0.99,
   "cuYdWithWaste": 1.09,
   "areaSqFt": 80
  },
  {
   "size": "8x10 ft",
   "thicknessIn": 6,
   "cuYd": 1.48,
   "cuYdWithWaste": 1.63,
   "areaSqFt": 80
  },
  {
   "size": "10x12 ft",
   "thicknessIn": 4,
   "cuYd": 1.48,
   "cuYdWithWaste": 1.63,
   "areaSqFt": 120
  },
  {
   "size": "10x12 ft",
   "thicknessIn": 6,
   "cuYd": 2.22,
   "cuYdWithWaste": 2.44,
   "areaSqFt": 120
  },
  {
   "size": "12x16 ft",
   "thicknessIn": 4,
   "cuYd": 2.37,
   "cuYdWithWaste": 2.61,
   "areaSqFt": 192
  },
  {
   "size": "12x16 ft",
   "thicknessIn": 6,
   "cuYd": 3.56,
   "cuYdWithWaste": 3.91,
   "areaSqFt": 192
  }
 ],
 "assumptions": {
  "wasteFactor": 0.1,
  "wasteNote": "10 percent extra for uneven subgrade, spillage and over-ordering; it is a planning assumption, not sourced.",
  "volumeFormula": "cuYd = width_ft * length_ft * (thickness_in/12) / 27",
  "rounding": "cubic yards to 0.01",
  "orderingNote": "Slabs this small (0.99 to 3.91 yd with waste) are well under a 10 yd truck, so short-load fees or a minimum order almost certainly apply; bagged mix is the alternative for the smallest slabs (about 45 bags per yd per one guide).",
  "notCovered": "Permits, site prep/excavation, anchoring, electrical wiring, tax, sales-price variation by region.",
  "pricesDrift": "Retail prices and sales change often; every price is a snapshot on its asof month."
 }
};
