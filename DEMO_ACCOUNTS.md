# Demo accounts

Made by `npm run seed` in `server/`. Everything here is test data: the email
domains end in `.test`, which can never be real addresses, and the phone
numbers and UPI IDs are made up. Sign in with the email (or phone) and password.
Re-running the seed replaces these accounts and their bookings.

Professionals are online and approved. A booking goes to the nearest one
whose services match and whose radius covers the address, so to test a
booking in an area, sign in as a professional based near it.

Most accounts are in Hyderabad. Professionals 77–100 (three per town) and
customers 43–50 (one per town) are in other Telangana towns: Warangal, Karimnagar, Nizamabad, Khammam, Nalgonda, Mahbubnagar, Siddipet, Adilabad.
A town customer's booking only finds professionals in that town who offer the service.

## Professionals (100)

| # | Name | Email | Password | Phone | Based in | Radius | Services |
|---|---|---|---|---|---|---|---|
| 1 | Naveen Sharma | naveen.sharma@letters.test | Provider@001 | 8100000001 | HITEC City, Hyderabad | 10 km | Pest control |
| 2 | Farhan Yadav | farhan.yadav@mailbox.test | Provider@002 | 8100000002 | Gachibowli, Hyderabad | 8 km | Women's salon & spa |
| 3 | Priya Patel | priya.patel@inbox.test | Provider@003 | 8100000003 | Kondapur, Hyderabad | 9 km | Men's salon & massage |
| 4 | Srinivas Hussain | srinivas.hussain@postbox.test | Provider@004 | 8100000004 | Kukatpally, Hyderabad | 10 km | AC & appliance repair, Pest control |
| 5 | Kavya Chowdary | kavya.chowdary@letters.test | Provider@005 | 8100000005 | Miyapur, Hyderabad | 9 km | Electrician |
| 6 | Fatima Verma | fatima.verma@mailbox.test | Provider@006 | 8100000006 | Jubilee Hills, Hyderabad | 11 km | Plumber |
| 7 | Keerthi Hussain | keerthi.hussain@inbox.test | Provider@007 | 8100000007 | Banjara Hills, Hyderabad | 9 km | Carpenter, AC & appliance repair |
| 8 | Arjun Nair | arjun.nair@postbox.test | Provider@008 | 8100000008 | Ameerpet, Hyderabad | 10 km | Painting & waterproofing |
| 9 | Keerthi Ali | keerthi.ali@letters.test | Provider@009 | 8100000009 | Begumpet, Hyderabad | 9 km | Home cleaning |
| 10 | Gayatri Sharma | gayatri.sharma@mailbox.test | Provider@010 | 8100000010 | Secunderabad, Hyderabad | 10 km | Pest control |
| 11 | Varun Naidu | varun.naidu@inbox.test | Provider@011 | 8100000011 | Somajiguda, Hyderabad | 8 km | Women's salon & spa |
| 12 | Swathi Hussain | swathi.hussain@postbox.test | Provider@012 | 8100000012 | Himayatnagar, Hyderabad | 9 km | Men's salon & massage |
| 13 | Harsha Patel | harsha.patel@letters.test | Provider@013 | 8100000013 | Abids, Hyderabad | 8 km | AC & appliance repair |
| 14 | Keerthi Varma | keerthi.varma@mailbox.test | Provider@014 | 8100000014 | Mehdipatnam, Hyderabad | 12 km | Electrician |
| 15 | Hari Patel | hari.patel@inbox.test | Provider@015 | 8100000015 | Tolichowki, Hyderabad | 8 km | Plumber |
| 16 | Mohammed Gupta | mohammed.gupta@postbox.test | Provider@016 | 8100000016 | Manikonda, Hyderabad | 8 km | Carpenter |
| 17 | Rohan Joshi | rohan.joshi@letters.test | Provider@017 | 8100000017 | Attapur, Hyderabad | 11 km | Painting & waterproofing |
| 18 | Farhan Pillai | farhan.pillai@mailbox.test | Provider@018 | 8100000018 | Charminar, Hyderabad | 9 km | Home cleaning, Men's salon & massage |
| 19 | Kavya Ali | kavya.ali@inbox.test | Provider@019 | 8100000019 | Malakpet, Hyderabad | 9 km | Pest control |
| 20 | Bhavana Joshi | bhavana.joshi@postbox.test | Provider@020 | 8100000020 | Dilsukhnagar, Hyderabad | 12 km | Women's salon & spa |
| 21 | Kiran Nair | kiran.nair@letters.test | Provider@021 | 8100000021 | LB Nagar, Hyderabad | 10 km | Men's salon & massage |
| 22 | Bhargav Siddiqui | bhargav.siddiqui@mailbox.test | Provider@022 | 8100000022 | Uppal, Hyderabad | 10 km | AC & appliance repair |
| 23 | Rohan Gupta | rohan.gupta@inbox.test | Provider@023 | 8100000023 | Tarnaka, Hyderabad | 11 km | Electrician |
| 24 | Meera Yadav | meera.yadav@postbox.test | Provider@024 | 8100000024 | Habsiguda, Hyderabad | 8 km | Plumber, Home cleaning |
| 25 | Suresh Goud | suresh.goud@letters.test | Provider@025 | 8100000025 | Kompally, Hyderabad | 8 km | Carpenter, AC & appliance repair |
| 26 | Aditya Iyer | aditya.iyer@mailbox.test | Provider@026 | 8100000026 | Madhapur, Hyderabad | 10 km | Painting & waterproofing |
| 27 | Swathi Patel | swathi.patel@inbox.test | Provider@027 | 8100000027 | HITEC City, Hyderabad | 11 km | Home cleaning |
| 28 | Meera Goud | meera.goud@postbox.test | Provider@028 | 8100000028 | Gachibowli, Hyderabad | 10 km | Pest control |
| 29 | Imran Khan | imran.khan@letters.test | Provider@029 | 8100000029 | Kondapur, Hyderabad | 11 km | Women's salon & spa |
| 30 | Srinivas Chowdary | srinivas.chowdary@mailbox.test | Provider@030 | 8100000030 | Kukatpally, Hyderabad | 11 km | Men's salon & massage, Plumber |
| 31 | Nikhil Rao | nikhil.rao@inbox.test | Provider@031 | 8100000031 | Miyapur, Hyderabad | 9 km | AC & appliance repair, Pest control |
| 32 | Gayatri Goud | gayatri.goud@postbox.test | Provider@032 | 8100000032 | Jubilee Hills, Hyderabad | 9 km | Electrician |
| 33 | Ayesha Iyer | ayesha.iyer@letters.test | Provider@033 | 8100000033 | Banjara Hills, Hyderabad | 12 km | Plumber, Home cleaning |
| 34 | Mohammed Rao | mohammed.rao@mailbox.test | Provider@034 | 8100000034 | Ameerpet, Hyderabad | 8 km | Carpenter |
| 35 | Varun Iyer | varun.iyer@inbox.test | Provider@035 | 8100000035 | Begumpet, Hyderabad | 11 km | Painting & waterproofing |
| 36 | Srinivas Gupta | srinivas.gupta@postbox.test | Provider@036 | 8100000036 | Secunderabad, Hyderabad | 12 km | Home cleaning, Men's salon & massage |
| 37 | Gayatri Goud | gayatri.goud@letters.test | Provider@037 | 8100000037 | Somajiguda, Hyderabad | 12 km | Pest control, Carpenter |
| 38 | Mahesh Ali | mahesh.ali@mailbox.test | Provider@038 | 8100000038 | Himayatnagar, Hyderabad | 12 km | Women's salon & spa |
| 39 | Imran Hussain | imran.hussain@inbox.test | Provider@039 | 8100000039 | Abids, Hyderabad | 8 km | Men's salon & massage, Plumber |
| 40 | Suresh Siddiqui | suresh.siddiqui@postbox.test | Provider@040 | 8100000040 | Mehdipatnam, Hyderabad | 11 km | AC & appliance repair, Pest control |
| 41 | Arjun Varma | arjun.varma@letters.test | Provider@041 | 8100000041 | Tolichowki, Hyderabad | 12 km | Electrician |
| 42 | Srinivas Pillai | srinivas.pillai@mailbox.test | Provider@042 | 8100000042 | Manikonda, Hyderabad | 10 km | Plumber |
| 43 | Akhil Verma | akhil.verma@inbox.test | Provider@043 | 8100000043 | Attapur, Hyderabad | 8 km | Carpenter, AC & appliance repair |
| 44 | Mohammed Rao | mohammed.rao@postbox.test | Provider@044 | 8100000044 | Charminar, Hyderabad | 11 km | Painting & waterproofing |
| 45 | Swathi Siddiqui | swathi.siddiqui@letters.test | Provider@045 | 8100000045 | Malakpet, Hyderabad | 10 km | Home cleaning |
| 46 | Shreya Patel | shreya.patel@mailbox.test | Provider@046 | 8100000046 | Dilsukhnagar, Hyderabad | 10 km | Pest control, Carpenter |
| 47 | Suresh Yadav | suresh.yadav@inbox.test | Provider@047 | 8100000047 | LB Nagar, Hyderabad | 11 km | Women's salon & spa |
| 48 | Sneha Sharma | sneha.sharma@postbox.test | Provider@048 | 8100000048 | Uppal, Hyderabad | 11 km | Men's salon & massage |
| 49 | Meera Ali | meera.ali@letters.test | Provider@049 | 8100000049 | Tarnaka, Hyderabad | 10 km | AC & appliance repair |
| 50 | Shreya Gupta | shreya.gupta@mailbox.test | Provider@050 | 8100000050 | Habsiguda, Hyderabad | 11 km | Electrician |
| 51 | Priya Kumar | priya.kumar@inbox.test | Provider@051 | 8100000051 | Kompally, Hyderabad | 8 km | Plumber, Home cleaning |
| 52 | Shreya Patel | shreya.patel@postbox.test | Provider@052 | 8100000052 | Madhapur, Hyderabad | 8 km | Carpenter |
| 53 | Kavya Goud | kavya.goud@letters.test | Provider@053 | 8100000053 | HITEC City, Hyderabad | 12 km | Painting & waterproofing |
| 54 | Ravi Sharma | ravi.sharma@mailbox.test | Provider@054 | 8100000054 | Gachibowli, Hyderabad | 9 km | Home cleaning, Men's salon & massage |
| 55 | Yasmin Hussain | yasmin.hussain@inbox.test | Provider@055 | 8100000055 | Kondapur, Hyderabad | 11 km | Pest control |
| 56 | Ishaan Rao | ishaan.rao@postbox.test | Provider@056 | 8100000056 | Kukatpally, Hyderabad | 12 km | Women's salon & spa |
| 57 | Anil Khan | anil.khan@letters.test | Provider@057 | 8100000057 | Miyapur, Hyderabad | 10 km | Men's salon & massage, Plumber |
| 58 | Kiran Rao | kiran.rao@mailbox.test | Provider@058 | 8100000058 | Jubilee Hills, Hyderabad | 12 km | AC & appliance repair, Pest control |
| 59 | Nikhil Ali | nikhil.ali@inbox.test | Provider@059 | 8100000059 | Banjara Hills, Hyderabad | 8 km | Electrician |
| 60 | Ravi Khan | ravi.khan@postbox.test | Provider@060 | 8100000060 | Ameerpet, Hyderabad | 10 km | Plumber |
| 61 | Venkat Rao | venkat.rao@letters.test | Provider@061 | 8100000061 | Begumpet, Hyderabad | 10 km | Carpenter |
| 62 | Ayesha Joshi | ayesha.joshi@mailbox.test | Provider@062 | 8100000062 | Secunderabad, Hyderabad | 10 km | Painting & waterproofing |
| 63 | Naveen Khan | naveen.khan@inbox.test | Provider@063 | 8100000063 | Somajiguda, Hyderabad | 11 km | Home cleaning |
| 64 | Ishaan Chowdary | ishaan.chowdary@postbox.test | Provider@064 | 8100000064 | Himayatnagar, Hyderabad | 9 km | Pest control |
| 65 | Swathi Ali | swathi.ali@letters.test | Provider@065 | 8100000065 | Abids, Hyderabad | 11 km | Women's salon & spa |
| 66 | Aarav Kumar | aarav.kumar@mailbox.test | Provider@066 | 8100000066 | Mehdipatnam, Hyderabad | 10 km | Men's salon & massage |
| 67 | Fatima Hussain | fatima.hussain@inbox.test | Provider@067 | 8100000067 | Tolichowki, Hyderabad | 9 km | AC & appliance repair |
| 68 | Farhan Rao | farhan.rao@postbox.test | Provider@068 | 8100000068 | Manikonda, Hyderabad | 11 km | Electrician |
| 69 | Sameer Nair | sameer.nair@letters.test | Provider@069 | 8100000069 | Attapur, Hyderabad | 8 km | Plumber |
| 70 | Keerthi Ali | keerthi.ali@mailbox.test | Provider@070 | 8100000070 | Charminar, Hyderabad | 8 km | Carpenter |
| 71 | Tejas Pillai | tejas.pillai@inbox.test | Provider@071 | 8100000071 | Malakpet, Hyderabad | 10 km | Painting & waterproofing |
| 72 | Sameer Rao | sameer.rao@postbox.test | Provider@072 | 8100000072 | Dilsukhnagar, Hyderabad | 12 km | Home cleaning, Men's salon & massage |
| 73 | Rohan Sharma | rohan.sharma@letters.test | Provider@073 | 8100000073 | LB Nagar, Hyderabad | 8 km | Pest control, Carpenter |
| 74 | Aditya Siddiqui | aditya.siddiqui@mailbox.test | Provider@074 | 8100000074 | Uppal, Hyderabad | 8 km | Women's salon & spa |
| 75 | Bhargav Goud | bhargav.goud@inbox.test | Provider@075 | 8100000075 | Tarnaka, Hyderabad | 12 km | Men's salon & massage, Plumber |
| 76 | Deepika Goud | deepika.goud@postbox.test | Provider@076 | 8100000076 | Habsiguda, Hyderabad | 8 km | AC & appliance repair |
| 77 | Mohammed Pillai | mohammed.pillai@letters.test | Provider@077 | 8100000077 | Warangal | 8 km | Electrician |
| 78 | Nikhil Siddiqui | nikhil.siddiqui@mailbox.test | Provider@078 | 8100000078 | Karimnagar | 12 km | Plumber |
| 79 | Varun Nair | varun.nair@inbox.test | Provider@079 | 8100000079 | Nizamabad | 10 km | Carpenter |
| 80 | Pooja Siddiqui | pooja.siddiqui@postbox.test | Provider@080 | 8100000080 | Khammam | 10 km | Painting & waterproofing |
| 81 | Arjun Verma | arjun.verma@letters.test | Provider@081 | 8100000081 | Nalgonda | 12 km | Home cleaning, Men's salon & massage |
| 82 | Ishaan Reddy | ishaan.reddy@mailbox.test | Provider@082 | 8100000082 | Mahbubnagar | 9 km | Pest control |
| 83 | Sai Naidu | sai.naidu@inbox.test | Provider@083 | 8100000083 | Siddipet | 11 km | Women's salon & spa |
| 84 | Arjun Kumar | arjun.kumar@postbox.test | Provider@084 | 8100000084 | Adilabad | 10 km | Men's salon & massage, Plumber |
| 85 | Lakshmi Joshi | lakshmi.joshi@letters.test | Provider@085 | 8100000085 | Warangal | 8 km | AC & appliance repair |
| 86 | Meera Chowdary | meera.chowdary@mailbox.test | Provider@086 | 8100000086 | Karimnagar | 11 km | Electrician |
| 87 | Zoya Iyer | zoya.iyer2@inbox.test | Provider@087 | 8100000087 | Nizamabad | 9 km | Plumber, Home cleaning |
| 88 | Keerthi Rao | keerthi.rao@postbox.test | Provider@088 | 8100000088 | Khammam | 10 km | Carpenter, AC & appliance repair |
| 89 | Sandeep Nair | sandeep.nair@letters.test | Provider@089 | 8100000089 | Nalgonda | 9 km | Painting & waterproofing |
| 90 | Aarav Chowdary | aarav.chowdary@mailbox.test | Provider@090 | 8100000090 | Mahbubnagar | 9 km | Home cleaning |
| 91 | Rahul Ali | rahul.ali@inbox.test | Provider@091 | 8100000091 | Siddipet | 9 km | Pest control, Carpenter |
| 92 | Sana Hussain | sana.hussain@postbox.test | Provider@092 | 8100000092 | Adilabad | 9 km | Women's salon & spa |
| 93 | Aarav Yadav | aarav.yadav@letters.test | Provider@093 | 8100000093 | Warangal | 11 km | Men's salon & massage |
| 94 | Pradeep Ali | pradeep.ali@mailbox.test | Provider@094 | 8100000094 | Karimnagar | 10 km | AC & appliance repair, Pest control |
| 95 | Sneha Yadav | sneha.yadav@inbox.test | Provider@095 | 8100000095 | Nizamabad | 11 km | Electrician |
| 96 | Sameer Gupta | sameer.gupta@postbox.test | Provider@096 | 8100000096 | Khammam | 10 km | Plumber |
| 97 | Uday Patel | uday.patel@letters.test | Provider@097 | 8100000097 | Nalgonda | 11 km | Carpenter, AC & appliance repair |
| 98 | Sandeep Naidu | sandeep.naidu@mailbox.test | Provider@098 | 8100000098 | Mahbubnagar | 12 km | Painting & waterproofing |
| 99 | Farhan Ali | farhan.ali@inbox.test | Provider@099 | 8100000099 | Siddipet | 10 km | Home cleaning, Men's salon & massage |
| 100 | Pradeep Yadav | pradeep.yadav@postbox.test | Provider@100 | 8100000100 | Adilabad | 11 km | Pest control, Carpenter |

## Customers (50)

Each has a saved home address in the area shown.

| # | Name | Email | Password | Phone | Home area |
|---|---|---|---|---|---|
| 1 | Varun Rao | varun.rao@inbox.test | Customer@001 | 7100000001 | Banjara Hills, Hyderabad |
| 2 | Bhargav Sharma | bhargav.sharma@postbox.test | Customer@002 | 7100000002 | Mehdipatnam, Hyderabad |
| 3 | Sai Varma | sai.varma@letters.test | Customer@003 | 7100000003 | LB Nagar, Hyderabad |
| 4 | Chaitanya Verma | chaitanya.verma@mailbox.test | Customer@004 | 7100000004 | Gachibowli, Hyderabad |
| 5 | Vijay Ali | vijay.ali@inbox.test | Customer@005 | 7100000005 | Begumpet, Hyderabad |
| 6 | Yasmin Pillai | yasmin.pillai@postbox.test | Customer@006 | 7100000006 | Manikonda, Hyderabad |
| 7 | Meera Hussain | meera.hussain@letters.test | Customer@007 | 7100000007 | Tarnaka, Hyderabad |
| 8 | Ayesha Gupta | ayesha.gupta@mailbox.test | Customer@008 | 7100000008 | Kukatpally, Hyderabad |
| 9 | Deepika Sharma | deepika.sharma@inbox.test | Customer@009 | 7100000009 | Somajiguda, Hyderabad |
| 10 | Fatima Ali | fatima.ali@postbox.test | Customer@010 | 7100000010 | Charminar, Hyderabad |
| 11 | Mahesh Pillai | mahesh.pillai@letters.test | Customer@011 | 7100000011 | Kompally, Hyderabad |
| 12 | Suresh Patel | suresh.patel@mailbox.test | Customer@012 | 7100000012 | Jubilee Hills, Hyderabad |
| 13 | Srinivas Iyer | srinivas.iyer@inbox.test | Customer@013 | 7100000013 | Abids, Hyderabad |
| 14 | Imran Iyer | imran.iyer@postbox.test | Customer@014 | 7100000014 | Dilsukhnagar, Hyderabad |
| 15 | Sai Ali | sai.ali@letters.test | Customer@015 | 7100000015 | HITEC City, Hyderabad |
| 16 | Deepika Iyer | deepika.iyer@mailbox.test | Customer@016 | 7100000016 | Ameerpet, Hyderabad |
| 17 | Zoya Iyer | zoya.iyer@inbox.test | Customer@017 | 7100000017 | Tolichowki, Hyderabad |
| 18 | Divya Ali | divya.ali@postbox.test | Customer@018 | 7100000018 | Uppal, Hyderabad |
| 19 | Sameer Goud | sameer.goud@letters.test | Customer@019 | 7100000019 | Kondapur, Hyderabad |
| 20 | Kiran Nair | kiran.nair@mailbox.test | Customer@020 | 7100000020 | Secunderabad, Hyderabad |
| 21 | Hari Rao | hari.rao@inbox.test | Customer@021 | 7100000021 | Attapur, Hyderabad |
| 22 | Nikhil Yadav | nikhil.yadav@postbox.test | Customer@022 | 7100000022 | Habsiguda, Hyderabad |
| 23 | Farhan Goud | farhan.goud@letters.test | Customer@023 | 7100000023 | Miyapur, Hyderabad |
| 24 | Chaitanya Rao | chaitanya.rao@mailbox.test | Customer@024 | 7100000024 | Himayatnagar, Hyderabad |
| 25 | Deepika Nair | deepika.nair@inbox.test | Customer@025 | 7100000025 | Malakpet, Hyderabad |
| 26 | Ramesh Chowdary | ramesh.chowdary@postbox.test | Customer@026 | 7100000026 | Madhapur, Hyderabad |
| 27 | Sneha Yadav | sneha.yadav@letters.test | Customer@027 | 7100000027 | Banjara Hills, Hyderabad |
| 28 | Hari Siddiqui | hari.siddiqui@mailbox.test | Customer@028 | 7100000028 | Mehdipatnam, Hyderabad |
| 29 | Tejas Sharma | tejas.sharma@inbox.test | Customer@029 | 7100000029 | LB Nagar, Hyderabad |
| 30 | Bhargav Hussain | bhargav.hussain@postbox.test | Customer@030 | 7100000030 | Gachibowli, Hyderabad |
| 31 | Pradeep Naidu | pradeep.naidu@letters.test | Customer@031 | 7100000031 | Begumpet, Hyderabad |
| 32 | Nikhil Patel | nikhil.patel@mailbox.test | Customer@032 | 7100000032 | Manikonda, Hyderabad |
| 33 | Chaitanya Nair | chaitanya.nair@inbox.test | Customer@033 | 7100000033 | Tarnaka, Hyderabad |
| 34 | Meera Sharma | meera.sharma@postbox.test | Customer@034 | 7100000034 | Kukatpally, Hyderabad |
| 35 | Naveen Chowdary | naveen.chowdary@letters.test | Customer@035 | 7100000035 | Somajiguda, Hyderabad |
| 36 | Fatima Chowdary | fatima.chowdary@mailbox.test | Customer@036 | 7100000036 | Charminar, Hyderabad |
| 37 | Mohammed Varma | mohammed.varma@inbox.test | Customer@037 | 7100000037 | Kompally, Hyderabad |
| 38 | Ramesh Nair | ramesh.nair@postbox.test | Customer@038 | 7100000038 | Jubilee Hills, Hyderabad |
| 39 | Sandeep Gupta | sandeep.gupta@letters.test | Customer@039 | 7100000039 | Abids, Hyderabad |
| 40 | Rahul Yadav | rahul.yadav@mailbox.test | Customer@040 | 7100000040 | Dilsukhnagar, Hyderabad |
| 41 | Varun Patel | varun.patel@inbox.test | Customer@041 | 7100000041 | HITEC City, Hyderabad |
| 42 | Akhil Gupta | akhil.gupta@postbox.test | Customer@042 | 7100000042 | Ameerpet, Hyderabad |
| 43 | Sameer Siddiqui | sameer.siddiqui@letters.test | Customer@043 | 7100000043 | Warangal |
| 44 | Vijay Siddiqui | vijay.siddiqui@mailbox.test | Customer@044 | 7100000044 | Karimnagar |
| 45 | Meera Chowdary | meera.chowdary@inbox.test | Customer@045 | 7100000045 | Nizamabad |
| 46 | Vijay Ali | vijay.ali@postbox.test | Customer@046 | 7100000046 | Khammam |
| 47 | Swathi Naidu | swathi.naidu@letters.test | Customer@047 | 7100000047 | Nalgonda |
| 48 | Kavya Kumar | kavya.kumar@mailbox.test | Customer@048 | 7100000048 | Mahbubnagar |
| 49 | Farhan Pillai | farhan.pillai@inbox.test | Customer@049 | 7100000049 | Siddipet |
| 50 | Sameer Verma | sameer.verma@postbox.test | Customer@050 | 7100000050 | Adilabad |
