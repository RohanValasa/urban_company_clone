// Places professionals can pick as their base: Hyderabad localities, then
// towns across Telangana. Same lists as the demo data in server/scripts/seed.js.
const HYDERABAD = [
  ["Madhapur", 17.4483, 78.3915], ["HITEC City", 17.4435, 78.3772], ["Gachibowli", 17.44, 78.3489],
  ["Kondapur", 17.4609, 78.3568], ["Kukatpally", 17.4849, 78.4138], ["Miyapur", 17.4968, 78.3614],
  ["Jubilee Hills", 17.4326, 78.4071], ["Banjara Hills", 17.4156, 78.4347], ["Ameerpet", 17.4375, 78.4482],
  ["Begumpet", 17.4447, 78.4664], ["Secunderabad", 17.4399, 78.4983], ["Somajiguda", 17.4239, 78.4583],
  ["Himayatnagar", 17.4022, 78.4867], ["Abids", 17.3924, 78.4757], ["Mehdipatnam", 17.3959, 78.4312],
  ["Tolichowki", 17.3999, 78.4136], ["Manikonda", 17.4026, 78.3866], ["Attapur", 17.3707, 78.4235],
  ["Charminar", 17.3616, 78.4747], ["Malakpet", 17.3747, 78.5038], ["Dilsukhnagar", 17.3687, 78.5247],
  ["LB Nagar", 17.3457, 78.5522], ["Uppal", 17.4058, 78.5591], ["Tarnaka", 17.4281, 78.5383],
  ["Habsiguda", 17.4182, 78.5434], ["Kompally", 17.5367, 78.4846],
];

const TOWNS = [
  ["Warangal", 17.9689, 79.5941], ["Hanamkonda", 18.0072, 79.5584], ["Karimnagar", 18.4386, 79.1288],
  ["Nizamabad", 18.6725, 78.0941], ["Khammam", 17.2473, 80.1514], ["Nalgonda", 17.0575, 79.2684],
  ["Mahbubnagar", 16.7488, 78.0035], ["Siddipet", 18.1018, 78.852], ["Adilabad", 19.6641, 78.532],
  ["Suryapet", 17.1405, 79.6236], ["Mancherial", 18.8714, 79.4443], ["Ramagundam", 18.7556, 79.474],
  ["Kothagudem", 17.5511, 80.6197], ["Sangareddy", 17.6194, 78.0817], ["Miryalaguda", 16.8722, 79.5625],
  ["Jagtial", 18.7909, 78.9119], ["Kamareddy", 18.3204, 78.3375], ["Nirmal", 19.0964, 78.3441],
];

export const AREAS = [
  ...HYDERABAD.map(([name, lat, lng]) => ({ label: `${name}, Hyderabad`, name, lat, lng, group: "Hyderabad" })),
  ...TOWNS.map(([name, lat, lng]) => ({ label: `${name}, Telangana`, name, lat, lng, group: "Other towns" })),
];

export const AREA_GROUPS = ["Hyderabad", "Other towns"].map((name) => ({
  name,
  areas: AREAS.filter((a) => a.group === name),
}));
