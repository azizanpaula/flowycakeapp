Dokumen Teknis: Aplikasi Manajemen Usaha Kue "CakeFlow"

Dokumen ini menguraikan arsitektur teknis, fitur, alur pengguna, dan skema database untuk aplikasi manajemen usaha kue berbasis web.

Tumpukan Teknologi:

Framework: Next.js (App Router)

UI: shadcn/ui

Backend & Database: Supabase (PostgreSQL)

Autentikasi: Clerk.js

## 🍰 1. Fitur Utama

Aplikasi ini akan memiliki modul-modul utama berikut untuk memastikan manajemen yang komprehensif.

Manajemen Pengguna & Hak Akses (Clerk.js)

Login, registrasi, dan manajemen profil pengguna.

Peran pengguna yang berbeda: Admin, Kasir, dan Staf Dapur. Setiap peran memiliki akses terbatas sesuai fungsinya.

Point of Sale (POS)

Antarmuka kasir yang intuitif untuk membuat pesanan baru.

Menambahkan produk ke keranjang, menghitung total, dan menerima pembayaran (tunai, digital).

Mencetak atau mengirim struk digital.

Integrasi langsung dengan modul stok: penjualan akan otomatis mengurangi stok produk jadi.

Manajemen Stok & Inventaris

Stok Bahan Baku: Melacak jumlah bahan seperti tepung, gula, telur, dll.

Stok Produk Jadi: Melacak jumlah kue yang siap dijual.

Notifikasi stok rendah untuk bahan baku dan produk jadi.

Fitur stock opname untuk penyesuaian stok fisik dan data.

Manajemen Resep & Produksi

Membuat resep untuk setiap produk, mendefinisikan bahan baku dan kuantitas yang dibutuhkan.

Fitur "Produksi": Saat staf dapur membuat kue, mereka dapat memasukkan jumlah yang diproduksi. Sistem akan:

Mengurangi stok bahan baku sesuai resep.

Menambah stok produk jadi.

Kalkulasi Harga Pokok Produksi (HPP) otomatis berdasarkan harga bahan baku.

Laporan & Analitik 💰

Laporan Penjualan: Harian, mingguan, bulanan. Termasuk produk terlaris.

Laporan Laba Rugi: Ringkasan pendapatan dikurangi HPP untuk melihat profitabilitas.

Laporan Stok: Nilai inventaris, pergerakan stok, dan bahan yang sering habis.

Manajemen Produk & Bahan Baku

Operasi CRUD (Create, Read, Update, Delete) untuk produk jadi (kue).

Operasi CRUD untuk bahan baku, termasuk unit (kg, gr, pcs) dan harga beli rata-rata.

## 🔄 2. Alur Pengguna (User Flow)

Berikut adalah beberapa alur kerja utama dalam aplikasi.

Alur 1: Penjualan oleh Kasir

Login: Kasir login menggunakan akun Clerk.

Buka POS: Kasir masuk ke halaman Point of Sale.

Pilih Produk: Menampilkan daftar produk jadi yang tersedia (stok > 0). Kasir memilih produk dan jumlah yang dibeli pelanggan.

Proses Pembayaran: Sistem menghitung total. Kasir memilih metode pembayaran.

Selesaikan Transaksi: Pesanan disimpan ke database.

Aksi Otomatis:

Tabel orders dan order_items terisi.

Stok di tabel products untuk item yang terjual berkurang.

Alur 2: Produksi Kue oleh Staf Dapur

Login: Staf Dapur login.

Buka Menu Produksi: Masuk ke halaman produksi.

Pilih Resep & Jumlah: Memilih kue yang akan dibuat (misal: "Black Forest") dan memasukkan jumlah (misal: "2 loyang").

Konfirmasi Produksi: Sistem menampilkan bahan baku yang akan digunakan dan jumlahnya. Staf mengonfirmasi.

Aksi Otomatis:

Stok di tabel ingredients berkurang sesuai resep dan jumlah produksi.

Stok di tabel products bertambah.

Sebuah catatan produksi dibuat di tabel production_logs.

## 🗃️ 3. Skema Database (PostgreSQL untuk Supabase)

Skema ini dirancang untuk menormalisasi data dan memanfaatkan fitur PostgreSQL seperti RLS (Row Level Security) yang terintegrasi dengan Supabase Auth.

SQL
-- Ekstensi yang mungkin diperlukan (aktifkan di dashboard Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABEL PENGGUNA & PROFIL
-- Menggunakan data dari Clerk via Supabase Auth
-- =============================================
-- Tabel ini untuk menyimpan data tambahan pengguna yang tidak ada di Clerk.
-- Terhubung dengan `auth.users` melalui foreign key.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'kasir' -- Peran: 'admin', 'kasir', 'staf_dapur'
);

-- =============================================
-- TABEL MANAJEMEN PRODUK & INVENTARIS
-- =============================================

-- Tabel untuk bahan baku
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL, -- e.g., 'kg', 'gram', 'pcs', 'liter'
    low_stock_threshold NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk produk jadi (kue)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk resep
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel penghubung antara resep dan bahan baku (Many-to-Many)
CREATE TABLE public.recipe_items (
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity_needed NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_id)
);


-- =============================================
-- TABEL TRANSAKSIONAL
-- =============================================

-- Tabel untuk pesanan (transaksi POS)
CREATE TABLE public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id), -- Kasir yang menangani
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'cash', 'qris', etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk item dalam setiap pesanan
CREATE TABLE public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price_per_item NUMERIC(10, 2) NOT NULL -- Harga saat penjualan
);

-- Tabel untuk mencatat aktivitas produksi
CREATE TABLE public.production_logs (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity_produced INT NOT NULL,
    user_id UUID REFERENCES public.profiles(id), -- Staf yang melakukan produksi
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk mencatat pembelian bahan baku
CREATE TABLE public.purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    supplier_name TEXT,
    total_cost NUMERIC(10, 2),
    user_id UUID REFERENCES public.profiles(id), -- Pengguna yang mencatat
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    cost_per_item NUMERIC(10, 2) NOT NULL
);


-- =============================================
-- KEBIJAKAN ROW LEVEL SECURITY (RLS)
-- =============================================

-- Fungsi helper untuk mendapatkan role pengguna saat ini dari tabel profiles
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- AKTIFKAN RLS UNTUK SEMUA TABEL
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;


-- CONTOH KEBIJAKAN RLS

-- 1. Pengguna hanya bisa melihat dan mengedit profil mereka sendiri.
CREATE POLICY "Users can view and edit their own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id);

-- 2. Semua pengguna yang terautentikasi bisa melihat produk, bahan, dan resep.
CREATE POLICY "Authenticated users can view products and ingredients"
ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view ingredients"
ON public.ingredients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view recipes"
ON public.recipes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view recipe items"
ON public.recipe_items FOR SELECT USING (auth.role() = 'authenticated');


-- 3. Hanya Admin yang bisa membuat/mengubah/menghapus produk, bahan, dan resep.
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can manage ingredients"
ON public.ingredients FOR ALL
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can manage recipes"
ON public.recipes FOR ALL
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can manage recipe items"
ON public.recipe_items FOR ALL
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');


-- 4. Kasir dan Admin bisa membuat pesanan (POS).
CREATE POLICY "Cashiers and Admins can create orders"
ON public.orders FOR INSERT
WITH CHECK (public.get_my_role() IN ('admin', 'kasir'));

-- 5. Staf Dapur dan Admin bisa mencatat produksi.
CREATE POLICY "Kitchen staff and Admins can log production"
ON public.production_logs FOR INSERT
WITH CHECK (public.get_my_role() IN ('admin', 'staf_dapur'));

-- 6. Admin bisa melihat semua laporan (semua order dan log), sedangkan kasir/staf hanya bisa melihat catatan yang mereka buat sendiri.
CREATE POLICY "Admins can see all transactional data, others see their own"
ON public.orders FOR SELECT
USING (public.get_my_role() = 'admin' OR user_id = auth.uid());

CREATE POLICY "Admins can see all production data, others see their own"
ON public.production_logs FOR SELECT
USING (public.get_my_role() = 'admin' OR user_id = auth.uid());

## 🚀 4. Langkah Selanjutnya

Inisialisasi Proyek: Atur proyek Next.js Anda dan hubungkan dengan Supabase.

Migrasi Database: Jalankan skema SQL di atas menggunakan fitur Migrations di Supabase CLI atau langsung di SQL Editor dashboard.

Setup Clerk: Integrasikan Clerk.js di aplikasi Next.js Anda. Buat webhook untuk menyinkronkan data pengguna baru dari Clerk ke tabel public.profiles Anda di Supabase.

Bangun Komponen UI: Buat komponen yang dapat digunakan kembali untuk form, tabel, dan kartu menggunakan shadcn/ui.

Implementasi Fitur: Mulai implementasi fitur satu per satu, dimulai dari CRUD Produk dan Bahan Baku, diikuti oleh POS, Produksi, dan terakhir Laporan.