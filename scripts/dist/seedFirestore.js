"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
// 🔹 Your Firebase config
var firebaseConfig = {
    apiKey: "AIzaSyAADWJD71NRBBK-L1Se6TeMol2PSJaqhIE",
    authDomain: "sparkle-86740.firebaseapp.com",
    projectId: "sparkle-86740",
    storageBucket: "sparkle-86740.firebasestorage.app",
    messagingSenderId: "629067342348",
    appId: "1:629067342348:web:f0489076391bf457780429",
    measurementId: "G-RTWZSCCVZ0"
};
// Initialize Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
// 🔹 Demo data
var demoCleaners = [
    {
        id: "cleaner1",
        name: "Jane Doe",
        email: "jane@example.com",
        photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
        rating: 4.8,
        location: "Helsinki",
        pricePerHour: 25,
        schedule: {
            monday: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }],
            tuesday: [{ start: "10:00", end: "15:00" }],
            wednesday: [],
            thursday: [{ start: "09:00", end: "12:00" }],
            friday: [{ start: "13:00", end: "17:00" }],
            saturday: [],
            sunday: [],
        },
        exceptions: [
            { date: "2025-09-25", start: "09:00", end: "13:00" },
            { date: "2025-09-28", start: "14:00", end: "18:00" },
        ],
    },
    {
        id: "cleaner2",
        name: "John Smith",
        email: "john@example.com",
        photoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
        rating: 4.5,
        location: "Espoo",
        pricePerHour: 20,
        schedule: {
            monday: [{ start: "08:00", end: "12:00" }],
            tuesday: [{ start: "12:00", end: "16:00" }],
            wednesday: [{ start: "09:00", end: "17:00" }],
            thursday: [],
            friday: [{ start: "10:00", end: "14:00" }],
            saturday: [{ start: "09:00", end: "12:00" }],
            sunday: [],
        },
        exceptions: [{ date: "2025-09-27", start: "12:00", end: "16:00" }],
    },
];
var demoBookings = [
    {
        id: "booking1",
        cleanerId: "cleaner1",
        customerId: "customer1",
        date: "2025-09-26",
        start: "09:00",
        end: "10:00",
        status: "confirmed",
    },
    {
        id: "booking2",
        cleanerId: "cleaner1",
        customerId: "customer2",
        date: "2025-09-26",
        start: "14:00",
        end: "15:00",
        status: "pending",
    },
    {
        id: "booking3",
        cleanerId: "cleaner2",
        customerId: "customer3",
        date: "2025-09-27",
        start: "12:00",
        end: "13:00",
        status: "confirmed",
    },
];
// 🔹 Seed function
function seedFirestore() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, demoCleaners_1, cleaner, _a, demoBookings_1, booking, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    _i = 0, demoCleaners_1 = demoCleaners;
                    _b.label = 1;
                case 1:
                    if (!(_i < demoCleaners_1.length)) return [3 /*break*/, 4];
                    cleaner = demoCleaners_1[_i];
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(db, "cleaners", cleaner.id), cleaner)];
                case 2:
                    _b.sent();
                    console.log("Added cleaner:", cleaner.name);
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    _a = 0, demoBookings_1 = demoBookings;
                    _b.label = 5;
                case 5:
                    if (!(_a < demoBookings_1.length)) return [3 /*break*/, 8];
                    booking = demoBookings_1[_a];
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(db, "bookings", booking.id), booking)];
                case 6:
                    _b.sent();
                    console.log("Added booking:", booking.id);
                    _b.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log("✅ Firestore seeded successfully!");
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _b.sent();
                    console.error("Error seeding Firestore:", error_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Run
seedFirestore();
