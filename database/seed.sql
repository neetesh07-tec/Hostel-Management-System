-- ============================================================================
-- Hostel Management System - Demo Seed Data
-- ============================================================================
--
-- ⚠️  PREREQUISITES:
--   1. Database "hostel_manegment" must exist (create it in pgAdmin first).
--   2. Run schema.sql FIRST (creates all tables).
--   3. Then run THIS file (seed.sql) to populate demo data.
--
--   Database name:  hostel_manegment
--
-- This script is SAFE to re-run. It does NOT delete existing data.
--
-- DEMO CREDENTIALS (development only):
--   Admin    -> email: admin@hostel.com        password: Admin@123
--   Students -> email: <see list below>        password: Student@123
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. BUILDING, FLOORS, SECTIONS, ROOMS  (1 building x 10 floors x 2 sections x 10 rooms = 200 rooms)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    b_id   INTEGER;
    f_id   INTEGER;
    s_id   INTEGER;
    rnum   INTEGER;
    cap    INTEGER;
    floor_num INTEGER;
    sec   INTEGER;
    room_idx INTEGER;
BEGIN
    -- Building
    INSERT INTO buildings (name, status)
    VALUES ('Grand Heritage Hostel', 'operational')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO b_id;

    IF b_id IS NULL THEN
        SELECT id INTO b_id FROM buildings WHERE name = 'Grand Heritage Hostel';
    END IF;

    FOR floor_num IN 1..10 LOOP
        -- Floor
        INSERT INTO floors (building_id, floor_number, name, status)
        VALUES (b_id, floor_num, 'Floor ' || floor_num, 'operational')
        ON CONFLICT (building_id, floor_number) DO NOTHING
        RETURNING id INTO f_id;

        IF f_id IS NULL THEN
            SELECT id INTO f_id FROM floors WHERE building_id = b_id AND floor_number = floor_num;
        END IF;

        FOR sec IN 1..2 LOOP
            -- Section (A or B)
            INSERT INTO sections (floor_id, name, status)
            VALUES (f_id, CASE WHEN sec = 1 THEN 'A' ELSE 'B' END, 'operational')
            ON CONFLICT (floor_id, name) DO NOTHING
            RETURNING id INTO s_id;

            IF s_id IS NULL THEN
                SELECT id INTO s_id FROM sections WHERE floor_id = f_id AND name = (CASE WHEN sec = 1 THEN 'A' ELSE 'B' END);
            END IF;

            FOR room_idx IN 1..10 LOOP
                -- Room number: floor*100 + (section-1)*10 + room_idx
                -- Floor 1: 101-110 (A), 111-120 (B)
                rnum := floor_num * 100 + (sec - 1) * 10 + room_idx;

                -- Variable capacity: cycle 2, 3, 4, 6 based on position
                cap := CASE (room_idx + sec) % 4
                    WHEN 0 THEN 2
                    WHEN 1 THEN 3
                    WHEN 2 THEN 4
                    ELSE 6
                END;

                INSERT INTO rooms (section_id, room_number, capacity, status)
                VALUES (s_id, rnum::TEXT, cap, 'operational')
                ON CONFLICT (section_id, room_number) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. ADMIN USER
-- ---------------------------------------------------------------------------
-- Password "Admin@123" hashed with bcrypt (10 rounds) via bcryptjs.
INSERT INTO users (email, password_hash, role, status)
VALUES (
    'admin@hostel.com',
    '$2a$10$.9m0WPIUwNE9kSO1yHVIQulHZr6wPEBBT1jvwhcp8okpRVookj3Nq',
    'admin',
    'active'
)
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. STUDENTS + STUDENT USER ACCOUNTS  (30 Bollywood-themed demo students)
--    Password for every student: Student@123
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    u_id INTEGER;
    i    INTEGER;

    names   TEXT[] := ARRAY[
        'Shah Rukh Khan','Salman Khan','Aamir Khan','Akshay Kumar','Ajay Devgn',
        'Hrithik Roshan','Ranbir Kapoor','Ranveer Singh','Vicky Kaushal','Varun Dhawan',
        'Sidharth Malhotra','Kartik Aaryan','Amitabh Bachchan','Saif Ali Khan','Tiger Shroff',
        'Deepika Padukone','Alia Bhatt','Priyanka Chopra','Katrina Kaif','Kareena Kapoor Khan',
        'Anushka Sharma','Shraddha Kapoor','Kiara Advani','Kriti Sanon','Kangana Ranaut',
        'Vidya Balan','Madhuri Dixit','Aishwarya Rai Bachchan','Taapsee Pannu','Janhvi Kapoor'
    ];
    codes   TEXT[] := ARRAY[
        'STU001','STU002','STU003','STU004','STU005',
        'STU006','STU007','STU008','STU009','STU010',
        'STU011','STU012','STU013','STU014','STU015',
        'STU016','STU017','STU018','STU019','STU020',
        'STU021','STU022','STU023','STU024','STU025',
        'STU026','STU027','STU028','STU029','STU030'
    ];
    emails  TEXT[] := ARRAY[
        'shahrukh.khan@student.hostel.com','salman.khan@student.hostel.com','aamir.khan@student.hostel.com','akshay.kumar@student.hostel.com','ajay.devgn@student.hostel.com',
        'hrithik.roshan@student.hostel.com','ranbir.kapoor@student.hostel.com','ranveer.singh@student.hostel.com','vicky.kaushal@student.hostel.com','varun.dhawan@student.hostel.com',
        'sidharth.malhotra@student.hostel.com','kartik.aaryan@student.hostel.com','amitabh.bachchan@student.hostel.com','saif.ali.khan@student.hostel.com','tiger.shroff@student.hostel.com',
        'deepika.padukone@student.hostel.com','alia.bhatt@student.hostel.com','priyanka.chopra@student.hostel.com','katrina.kaif@student.hostel.com','kareena.kapoor@student.hostel.com',
        'anushka.sharma@student.hostel.com','shraddha.kapoor@student.hostel.com','kiara.advani@student.hostel.com','kriti.sanon@student.hostel.com','kangana.ranaut@student.hostel.com',
        'vidya.balan@student.hostel.com','madhuri.dixit@student.hostel.com','aishwarya.rai@student.hostel.com','taapsee.pannu@student.hostel.com','janhvi.kapoor@student.hostel.com'
    ];
    phones  TEXT[] := ARRAY[
        '+91-9876543201','+91-9876543202','+91-9876543203','+91-9876543204','+91-9876543205',
        '+91-9876543206','+91-9876543207','+91-9876543208','+91-9876543209','+91-9876543210',
        '+91-9876543211','+91-9876543212','+91-9876543213','+91-9876543214','+91-9876543215',
        '+91-9876543216','+91-9876543217','+91-9876543218','+91-9876543219','+91-9876543220',
        '+91-9876543221','+91-9876543222','+91-9876543223','+91-9876543224','+91-9876543225',
        '+91-9876543226','+91-9876543227','+91-9876543228','+91-9876543229','+91-9876543230'
    ];
    genders TEXT[] := ARRAY[
        'male','male','male','male','male',
        'male','male','male','male','male',
        'male','male','male','male','male',
        'female','female','female','female','female',
        'female','female','female','female','female',
        'female','female','female','female','female'
    ];

    student_hash TEXT := '$2a$10$FMC2eC.Ew8k7v0HNOWQgd.GgJY5Mg/N0zFr3gGg1NGQwT0eMmVTES';
BEGIN
    FOR i IN 1..array_length(names, 1) LOOP
        INSERT INTO users (email, password_hash, role, status)
        VALUES (emails[i], student_hash, 'student', 'active')
        ON CONFLICT (email) DO NOTHING
        RETURNING id INTO u_id;

        IF u_id IS NULL THEN
            SELECT id INTO u_id FROM users WHERE email = emails[i];
        END IF;

        INSERT INTO students (user_id, full_name, student_code, email, phone, gender, account_status)
        VALUES (u_id, names[i], codes[i], emails[i], phones[i], genders[i], 'active')
        ON CONFLICT (student_code) DO NOTHING;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. BOOKINGS  (varied statuses: checked_in, confirmed, pending, cancelled, completed)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    sid  INTEGER;
    rid  INTEGER;
    i    INTEGER;

    -- Parallel arrays index 1..30
    scodes  TEXT[] := ARRAY[
        'STU001','STU002','STU003','STU004','STU005','STU006','STU007','STU008',
        'STU016','STU017','STU018','STU019',
        'STU009','STU010','STU020','STU021','STU022','STU023',
        'STU011','STU012','STU024','STU025',
        'STU013','STU014','STU026','STU027',
        'STU015','STU028','STU029','STU030'
    ];
    rooms_n TEXT[] := ARRAY[
        '101','101','102','102','103','103','104','104',
        '201','201','202','202',
        '105','105','203','203','204','204',
        '106','106','205','205',
        '107','107','206','206',
        '108','208','109','209'
    ];
    stats   TEXT[] := ARRAY[
        'checked_in','checked_in','checked_in','checked_in','checked_in','checked_in','checked_in','checked_in',
        'checked_in','checked_in','checked_in','checked_in',
        'confirmed','confirmed','confirmed','confirmed','confirmed','confirmed',
        'pending','pending','pending','pending',
        'cancelled','cancelled','cancelled','cancelled',
        'completed','completed','completed','completed'
    ];
    checkin DATE[] := ARRAY[
        '2026-09-01','2026-09-05','2026-09-10','2026-09-12','2026-09-15','2026-09-16','2026-09-20','2026-09-22',
        '2026-09-01','2026-09-03','2026-09-08','2026-09-09',
        '2026-11-15','2026-11-15','2026-11-20','2026-11-20','2026-12-01','2026-12-01',
        '2026-11-10','2026-11-10','2026-11-25','2026-11-25',
        '2026-10-01','2026-10-01','2026-10-05','2026-10-05',
        '2026-07-01','2026-07-15','2026-08-01','2026-08-15'
    ];
    expout  DATE[] := ARRAY[
        '2026-12-01','2026-12-05','2026-12-10','2026-12-12','2026-12-15','2026-12-16','2026-12-20','2026-12-22',
        '2026-12-01','2026-12-03','2026-12-08','2026-12-09',
        '2027-02-15','2027-02-15','2027-02-20','2027-02-20','2027-03-01','2027-03-01',
        '2027-02-10','2027-02-10','2027-02-25','2027-02-25',
        '2027-01-01','2027-01-01','2027-01-05','2027-01-05',
        '2026-09-30','2026-10-05','2026-10-10','2026-10-15'
    ];
    actin   DATE[] := ARRAY[
        '2026-09-01','2026-09-05','2026-09-10','2026-09-12','2026-09-15','2026-09-16','2026-09-20','2026-09-22',
        '2026-09-01','2026-09-03','2026-09-08','2026-09-09',
        NULL,NULL,NULL,NULL,NULL,NULL,
        NULL,NULL,NULL,NULL,
        NULL,NULL,NULL,NULL,
        '2026-07-01','2026-07-15','2026-08-01','2026-08-15'
    ];
    actout  DATE[] := ARRAY[
        NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,
        NULL,NULL,NULL,NULL,
        NULL,NULL,NULL,NULL,NULL,NULL,
        NULL,NULL,NULL,NULL,
        NULL,NULL,NULL,NULL,
        '2026-09-30','2026-10-05','2026-10-10','2026-10-15'
    ];
BEGIN
    FOR i IN 1..array_length(scodes, 1) LOOP
        SELECT id INTO sid FROM students WHERE student_code = scodes[i];
        SELECT id INTO rid FROM rooms WHERE room_number = rooms_n[i]
            AND section_id IN (
                SELECT s.id FROM sections s
                JOIN floors f ON f.id = s.floor_id
                JOIN buildings b ON b.id = f.building_id
                WHERE b.name = 'Grand Heritage Hostel'
            )
            LIMIT 1;

        -- Idempotent: skip if an identical booking already exists.
        INSERT INTO bookings (student_id, room_id, status, check_in_date, expected_check_out, actual_check_in, actual_check_out)
        SELECT sid, rid, stats[i], checkin[i], expout[i], actin[i], actout[i]
        WHERE NOT EXISTS (
            SELECT 1 FROM bookings
            WHERE student_id = sid
              AND room_id = rid
              AND check_in_date = checkin[i]
              AND expected_check_out = expout[i]
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. FEES + PAYMENTS  (varied states: fully paid, partially paid, unpaid, overdue)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    sid      INTEGER;
    fid      INTEGER;
    i        INTEGER;

    scodes  TEXT[] := ARRAY[
        'STU001','STU002','STU003','STU004','STU005','STU006','STU007','STU008',
        'STU009','STU010','STU011','STU012','STU013','STU014','STU015',
        'STU016','STU017','STU018','STU019','STU020','STU021','STU022','STU023',
        'STU024','STU025','STU026','STU027','STU028','STU029','STU030'
    ];
    -- amount due
    dues    NUMERIC[] := ARRAY[
        12000,12000,12000,12000,12000,12000,12000,12000,
        12000,12000,12000,12000,12000,12000,12000,
        12000,12000,12000,12000,12000,12000,12000,12000,
        12000,12000,12000,12000,12000,12000,12000
    ];
    -- due dates (mix of past and future relative to 2026-10-10)
    dues_dates DATE[] := ARRAY[
        '2026-09-30','2026-11-30','2026-11-30','2026-09-15','2026-09-30','2026-11-30','2026-11-30','2026-09-20',
        '2026-11-15','2026-11-15','2026-11-10','2026-11-10','2026-09-25','2026-09-25','2026-09-30',
        '2026-09-30','2026-11-30','2026-09-10','2026-11-30','2026-11-20','2026-11-20','2026-11-25','2026-11-25',
        '2026-09-15','2026-09-15','2026-11-30','2026-11-30','2026-09-30','2026-10-01','2026-10-05'
    ];
    -- payment amounts (0 means no payment)
    paid    NUMERIC[] := ARRAY[
        12000, 6000, 0, 3000, 12000, 4000, 0, 8000,
        12000, 5000, 0, 2000, 0, 0, 12000,
        12000, 7000, 0, 9000, 12000, 3000, 0, 6000,
        0, 0, 12000, 4000, 12000, 0, 0
    ];
BEGIN
    FOR i IN 1..array_length(scodes, 1) LOOP
        SELECT id INTO sid FROM students WHERE student_code = scodes[i];

        -- Idempotent: reuse the fee if it already exists for this student/period.
        SELECT id INTO fid FROM fees
         WHERE student_id = sid
           AND description = 'Accommodation - Semester Oct 2026'
           AND due_date = dues_dates[i];

        IF fid IS NULL THEN
            INSERT INTO fees (student_id, description, amount_due, due_date)
            VALUES (sid, 'Accommodation - Semester Oct 2026', dues[i], dues_dates[i])
            RETURNING id INTO fid;
        END IF;

        -- Idempotent: only insert the payment if one does not already exist for this fee.
        IF paid[i] > 0 THEN
            IF NOT EXISTS (SELECT 1 FROM payments WHERE fee_id = fid) THEN
                INSERT INTO payments (fee_id, student_id, amount, payment_date, payment_method)
                VALUES (fid, sid, paid[i], dues_dates[i] - INTERVAL '5 days', 'bank_transfer');
            END IF;
        END IF;
    END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- Seed complete. Run the verification queries below to confirm.
-- ============================================================================
