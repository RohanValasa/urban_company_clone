// Hyderabad localities professionals can pick as their base. Same list as the
// demo data in server/scripts/seed.js.
export const AREAS = [
  ["Madhapur", 17.4483, 78.3915], ["HITEC City", 17.4435, 78.3772], ["Gachibowli", 17.44, 78.3489],
  ["Kondapur", 17.4609, 78.3568], ["Kukatpally", 17.4849, 78.4138], ["Miyapur", 17.4968, 78.3614],
  ["Jubilee Hills", 17.4326, 78.4071], ["Banjara Hills", 17.4156, 78.4347], ["Ameerpet", 17.4375, 78.4482],
  ["Begumpet", 17.4447, 78.4664], ["Secunderabad", 17.4399, 78.4983], ["Somajiguda", 17.4239, 78.4583],
  ["Himayatnagar", 17.4022, 78.4867], ["Abids", 17.3924, 78.4757], ["Mehdipatnam", 17.3959, 78.4312],
  ["Tolichowki", 17.3999, 78.4136], ["Manikonda", 17.4026, 78.3866], ["Attapur", 17.3707, 78.4235],
  ["Charminar", 17.3616, 78.4747], ["Malakpet", 17.3747, 78.5038], ["Dilsukhnagar", 17.3687, 78.5247],
  ["LB Nagar", 17.3457, 78.5522], ["Uppal", 17.4058, 78.5591], ["Tarnaka", 17.4281, 78.5383],
  ["Habsiguda", 17.4182, 78.5434], ["Kompally", 17.5367, 78.4846],
].map(([name, lat, lng]) => ({ label: `${name}, Hyderabad`, name, lat, lng }));
