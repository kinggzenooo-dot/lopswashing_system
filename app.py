import os
import uuid
from datetime import datetime, date
from urllib.parse import urlparse
from flask import Flask, request, jsonify, session, redirect, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from supabase import create_client, Client

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "lops-carwash-secret-production-key-2026")

FRONTEND_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
UPLOAD_FOLDER = os.path.join(FRONTEND_FOLDER, "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Supabase Client Singleton
_supabase_client: Client = None
_schema_checked = False


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_supabase_client() -> Client:
    """Initialize and return the Supabase client using SUPABASE_URL and SUPABASE_KEY."""
    global _supabase_client, _schema_checked
    if _supabase_client is not None:
        return _supabase_client

    url = os.environ.get("SUPABASE_URL", "").strip()
    key = (os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")).strip()

    if not url or not key:
        print("DATABASE WARNING: SUPABASE_URL and/or SUPABASE_KEY environment variables are missing.")
        return None

    try:
        _supabase_client = create_client(url, key)
        if not _schema_checked:
            auto_seed_database_if_needed(_supabase_client)
            _schema_checked = True
        return _supabase_client
    except Exception as error:
        print("SUPABASE INITIALIZATION ERROR:", error)
        return None


def auto_seed_database_if_needed(supabase: Client):
    """Automatically seed default admin and starter catalog if the users table is empty."""
    try:
        res = supabase.table("users").select("id").limit(1).execute()
        if res.data and len(res.data) > 0:
            return False

        print("Fresh database detected. Initializing default admin and starter data...")

        # 1. Default Administrator Account (admin@lopscarwash.ph / thelegend54)
        admin_pass = generate_password_hash("thelegend54")
        supabase.table("users").insert({
            "fullname": "Lops Carwash Administrator",
            "email": "admin@lopscarwash.ph",
            "password": admin_pass,
            "role": "Administrator"
        }).execute()

        # 2. Sample Customer
        supabase.table("customers").insert({
            "customer_name": "Juan Dela Cruz",
            "phone": "09123456789",
            "email": "juan@gmail.com",
            "address": "Cebu City",
            "status": "Active"
        }).execute()

        # 3. Sample Supplier
        supabase.table("suppliers").insert({
            "supplier_name": "Lops Auto Care Supplies",
            "contact_person": "John Smith",
            "phone": "09112223333",
            "email": "supplier@gmail.com",
            "address": "Cebu City",
            "status": "Active"
        }).execute()

        # 4. Starter Products Catalog
        starter_products = [
            {"product_name": "Express Wash", "sku": "LCS-001", "category": "Exterior Wash", "description": "Foam wash, rinse, tire shine and hand dry", "price": 150.00, "stock": 100, "reorder_level": 10},
            {"product_name": "Kaiju Rider", "sku": "STK-002", "category": "Anime", "description": "Neon kaiju rider vinyl sticker", "price": 20.00, "stock": 50, "reorder_level": 8},
            {"product_name": "Boss Fight", "sku": "STK-003", "category": "Gaming", "description": "Controller-inspired waterproof sticker", "price": 18.00, "stock": 60, "reorder_level": 10},
            {"product_name": "Grind Line", "sku": "STK-004", "category": "Skate", "description": "Skate deck line-art vinyl sticker", "price": 15.00, "stock": 75, "reorder_level": 10},
            {"product_name": "Ronin Ghost", "sku": "STK-005", "category": "Anime", "description": "Ghost ronin holographic-style sticker", "price": 20.00, "stock": 40, "reorder_level": 8},
            {"product_name": "Retro Deck", "sku": "STK-006", "category": "Skate", "description": "Retro arcade deck vinyl sticker", "price": 16.00, "stock": 55, "reorder_level": 10},
            {"product_name": "Combo Breaker", "sku": "STK-007", "category": "Gaming", "description": "Arcade combo vinyl sticker", "price": 15.00, "stock": 65, "reorder_level": 10},
        ]
        supabase.table("products").insert(starter_products).execute()
        print("Database initialized successfully with default admin and starter products.")
        return True
    except Exception as e:
        print("AUTO SEED NOTICE:", e)
        return False


def login_required():
    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401
    return None


def admin_required():
    auth_error = login_required()
    if auth_error:
        return auth_error
    if session.get("role") != "Administrator":
        return jsonify({"success": False, "message": "Administrator access is required."}), 403
    return None


def admin_page_required():
    if "user_id" not in session:
        return redirect("/login")
    if session.get("role") != "Administrator":
        return redirect("/shop")
    return None


# =====================================================
# FRONTEND PAGES
# =====================================================

@app.route("/")
def home():
    return send_from_directory(FRONTEND_FOLDER, "index.html")


@app.route("/login")
def login_page():
    return send_from_directory(FRONTEND_FOLDER, "login.html")


@app.route("/dashboard")
def dashboard_page():
    access_error = admin_page_required()
    if access_error:
        return access_error
    return send_from_directory(FRONTEND_FOLDER, "dashboard.html")


@app.route("/products")
def products_page():
    access_error = admin_page_required()
    if access_error:
        return access_error
    return send_from_directory(FRONTEND_FOLDER, "products.html")


@app.route("/customer")
def customer_page():
    access_error = admin_page_required()
    if access_error:
        return access_error
    return send_from_directory(FRONTEND_FOLDER, "customer.html")


@app.route("/supplier")
def supplier_page():
    access_error = admin_page_required()
    if access_error:
        return access_error
    return send_from_directory(FRONTEND_FOLDER, "supplier.html")


@app.route("/sales")
def sales_page():
    access_error = admin_page_required()
    if access_error:
        return access_error
    return send_from_directory(FRONTEND_FOLDER, "sales.html")


@app.route("/report")
def report_page():
    access_error = admin_page_required()
    if access_error:
        return access_error
    return send_from_directory(FRONTEND_FOLDER, "report.html")


@app.route("/register")
def register_page():
    return send_from_directory(FRONTEND_FOLDER, "register.html")


@app.route("/shop")
def shop_page():
    if "user_id" not in session:
        return redirect("/login")
    if session.get("role") != "Customer":
        return redirect("/dashboard")
    return send_from_directory(FRONTEND_FOLDER, "shop.html")


@app.route("/uploads/<path:filename>")
def uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_FOLDER, filename)


# =====================================================
# AUTHENTICATION
# =====================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required."}), 400

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed. Please ensure SUPABASE_URL and SUPABASE_KEY are set."}), 500

    try:
        res = supabase.table("users").select("id, fullname, email, password, role").eq("email", email).limit(1).execute()
        users = res.data or []
        if not users:
            return jsonify({"success": False, "message": "Email not found."}), 401

        user = users[0]
        if not check_password_hash(user["password"], password):
            return jsonify({"success": False, "message": "Incorrect password."}), 401

        session["user_id"] = user["id"]
        session["fullname"] = user["fullname"]
        session["email"] = user["email"]
        session["role"] = user["role"]

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "user": {
                "id": user["id"],
                "fullname": user["fullname"],
                "email": user["email"],
                "role": user["role"]
            }
        })
    except Exception as error:
        print("LOGIN ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    fullname = str(data.get("fullname", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    phone = str(data.get("phone", "")).strip() or None

    if not fullname or not email or len(password) < 8:
        return jsonify({"success": False, "message": "Name, email, and an 8-character password are required."}), 400

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    try:
        res = supabase.table("users").select("id").eq("email", email).limit(1).execute()
        if res.data and len(res.data) > 0:
            return jsonify({"success": False, "message": "An account with this email already exists."}), 409

        supabase.table("users").insert({
            "fullname": fullname,
            "email": email,
            "password": generate_password_hash(password),
            "role": "Customer"
        }).execute()

        cust_res = supabase.table("customers").select("id").eq("email", email).limit(1).execute()
        if not cust_res.data:
            supabase.table("customers").insert({
                "customer_name": fullname,
                "phone": phone,
                "email": email,
                "status": "Active"
            }).execute()

        return jsonify({"success": True, "message": "Customer account created. Please log in."}), 201
    except Exception as error:
        print("REGISTER ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/api/user", methods=["GET"])
def get_current_user():
    if "user_id" not in session:
        return jsonify({"logged_in": False})

    return jsonify({
        "logged_in": True,
        "user": {
            "id": session["user_id"],
            "fullname": session["fullname"],
            "email": session["email"],
            "role": session["role"]
        }
    })


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({
        "success": True,
        "message": "You have been logged out."
    })


# =====================================================
# DASHBOARD
# =====================================================

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    auth_error = admin_required()
    if auth_error:
        return auth_error

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    try:
        # 1. Total products
        prod_res = supabase.table("products").select("id, product_name, stock, reorder_level").execute()
        products = prod_res.data or []
        total_products = len(products)

        # 2. Total customers
        cust_res = supabase.table("customers").select("id").execute()
        total_customers = len(cust_res.data or [])

        # 3. Total sales & Recent transactions
        sales_res = supabase.table("sales").select("id, invoice_no, customer_id, total_amount, payment_method, sale_date").order("id", desc=True).execute()
        sales = sales_res.data or []
        total_sales = sum(float(s.get("total_amount") or 0) for s in sales)

        # Low stock calculations
        low_stock_list = [p for p in products if int(p.get("stock") or 0) <= int(p.get("reorder_level") or 5)]
        low_stock_list.sort(key=lambda x: int(x.get("stock") or 0))
        low_stock_products = [
            {
                "product_name": p["product_name"],
                "stock": p["stock"],
                "reorder_level": p["reorder_level"]
            }
            for p in low_stock_list[:7]
        ]

        # Customer name lookup dictionary for recent transactions
        cust_map = {c["id"]: c.get("customer_name") for c in (supabase.table("customers").select("id, customer_name").execute().data or [])}

        recent_transactions = []
        for s in sales[:5]:
            recent_transactions.append({
                "invoice_no": s.get("invoice_no"),
                "customer_name": cust_map.get(s.get("customer_id"), "Walk-in Customer"),
                "total_amount": float(s.get("total_amount") or 0),
                "payment_method": s.get("payment_method"),
                "sale_date": s.get("sale_date")
            })

        return jsonify({
            "success": True,
            "data": {
                "total_products": total_products,
                "total_customers": total_customers,
                "total_sales": round(float(total_sales), 2),
                "low_stock": len(low_stock_list),
                "low_stock_products": low_stock_products,
                "recent_transactions": recent_transactions
            }
        })
    except Exception as error:
        print("DASHBOARD ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


# =====================================================
# PRODUCTS
# =====================================================

@app.route("/api/products", methods=["GET"])
def get_products():
    auth_error = login_required()
    if auth_error:
        return auth_error

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    try:
        res = supabase.table("products").select("id, product_name, sku, category, description, price, stock, reorder_level, image").order("id", desc=True).execute()
        products = res.data or []

        for product in products:
            product["price"] = float(product.get("price") or 0)
            stock = int(product.get("stock") or 0)
            reorder = int(product.get("reorder_level") or 5)
            if stock == 0:
                product["stock_status"] = "Out of Stock"
            elif stock <= reorder:
                product["stock_status"] = "Low Stock"
            else:
                product["stock_status"] = "Available"

        return jsonify({"success": True, "products": products})
    except Exception as error:
        print("GET PRODUCTS ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/api/products", methods=["POST"])
def add_product():
    auth_error = admin_required()
    if auth_error:
        return auth_error

    image_path = None
    filename = None

    try:
        product_name = request.form.get("product_name", "").strip()
        sku = request.form.get("sku", "").strip()
        category = request.form.get("category", "").strip()
        description = request.form.get("description", "").strip()
        price = request.form.get("price")
        stock = request.form.get("stock")
        reorder_level = request.form.get("reorder_level", 10)
        image = request.files.get("image")

        if not product_name or not sku or not price or not stock:
            return jsonify({"success": False, "message": "Product name, SKU, price, and stock are required."}), 400

        if image and image.filename != "":
            if not allowed_file(image.filename):
                return jsonify({"success": False, "message": "Only JPG, JPEG, PNG, and WEBP images are allowed."}), 400
            extension = secure_filename(image.filename).rsplit(".", 1)[1].lower()
            filename = f"{uuid.uuid4()}.{extension}"
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(image_path)

        supabase = get_supabase_client()
        if supabase is None:
            if image_path and os.path.exists(image_path):
                os.remove(image_path)
            return jsonify({"success": False, "message": "Database connection failed."}), 500

        # Check SKU uniqueness
        sku_check = supabase.table("products").select("id").eq("sku", sku).limit(1).execute()
        if sku_check.data:
            if image_path and os.path.exists(image_path):
                os.remove(image_path)
            return jsonify({"success": False, "message": f"A product with SKU '{sku}' already exists."}), 400

        supabase.table("products").insert({
            "product_name": product_name,
            "sku": sku,
            "category": category,
            "description": description,
            "price": float(price),
            "stock": int(stock),
            "reorder_level": int(reorder_level),
            "image": filename
        }).execute()

        return jsonify({
            "success": True,
            "message": "Product added successfully!",
            "image": filename
        })
    except Exception as error:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
        print("ADD PRODUCT ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/api/products/<int:product_id>", methods=["PUT"])
def edit_product(product_id):
    auth_error = admin_required()
    if auth_error:
        return auth_error

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    new_image_path = None
    try:
        check_res = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
        products = check_res.data or []
        if not products:
            return jsonify({"success": False, "message": "Product not found."}), 404

        product = products[0]
        product_name = request.form.get("product_name", "").strip()
        sku = request.form.get("sku", "").strip()
        category = request.form.get("category", "").strip()
        description = request.form.get("description", "").strip()
        price = request.form.get("price")
        stock = request.form.get("stock")
        reorder_level = request.form.get("reorder_level", 10)
        image = request.files.get("image")

        if not product_name or not sku or not price or not stock:
            return jsonify({"success": False, "message": "Product name, SKU, price, and stock are required."}), 400

        filename = product.get("image")

        if image and image.filename:
            if not allowed_file(image.filename):
                return jsonify({"success": False, "message": "Only JPG, JPEG, PNG, and WEBP images are allowed."}), 400
            extension = secure_filename(image.filename).rsplit(".", 1)[1].lower()
            filename = f"{uuid.uuid4()}.{extension}"
            new_image_path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(new_image_path)

        supabase.table("products").update({
            "product_name": product_name,
            "sku": sku,
            "category": category,
            "description": description,
            "price": float(price),
            "stock": int(stock),
            "reorder_level": int(reorder_level),
            "image": filename
        }).eq("id", product_id).execute()

        if new_image_path and product.get("image") and product.get("image") != filename:
            old_image_path = os.path.join(UPLOAD_FOLDER, product["image"])
            if os.path.exists(old_image_path):
                os.remove(old_image_path)

        return jsonify({"success": True, "message": "Product updated successfully."})
    except Exception as error:
        if new_image_path and os.path.exists(new_image_path):
            os.remove(new_image_path)
        print("EDIT PRODUCT ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    auth_error = admin_required()
    if auth_error:
        return auth_error

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    try:
        check_res = supabase.table("products").select("image").eq("id", product_id).limit(1).execute()
        products = check_res.data or []
        if not products:
            return jsonify({"success": False, "message": "Product not found."}), 404

        product = products[0]
        supabase.table("products").delete().eq("id", product_id).execute()

        if product.get("image"):
            image_path = os.path.join(UPLOAD_FOLDER, product["image"])
            if os.path.exists(image_path):
                os.remove(image_path)

        return jsonify({"success": True, "message": "Product deleted successfully."})
    except Exception as error:
        print("DELETE PRODUCT ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


# =====================================================
# CUSTOMERS & SUPPLIERS
# =====================================================

def json_body():
    return request.get_json(silent=True) or {}


def validate_contact(data, name_key):
    name = str(data.get(name_key, "")).strip()
    if not name:
        return None, (jsonify({"success": False, "message": "Name is required."}), 400)
    status = str(data.get("status", "Active")).strip()
    if status not in ("Active", "Inactive"):
        return None, (jsonify({"success": False, "message": "Status must be Active or Inactive."}), 400)
    return (name, str(data.get("email", "")).strip() or None,
            str(data.get("phone", "")).strip() or None,
            str(data.get("address", "")).strip() or None, status), None


def contact_response(table, name_column, item_id=None):
    auth_error = admin_required()
    if auth_error:
        return auth_error

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    try:
        is_supplier = table == "suppliers"
        if request.method == "GET":
            res = supabase.table(table).select("*").order("id", desc=True).execute()
            return jsonify({"success": True, table: res.data or []})

        data = json_body()
        values, error = validate_contact(data, name_column)
        if error:
            return error

        contact_person = str(data.get("contact_person", "")).strip() or None
        payload = {
            name_column: values[0],
            "email": values[1],
            "phone": values[2],
            "address": values[3],
            "status": values[4]
        }
        if is_supplier:
            payload["contact_person"] = contact_person

        if request.method == "POST":
            supabase.table(table).insert(payload).execute()
        else:
            up_res = supabase.table(table).update(payload).eq("id", item_id).execute()
            if not up_res.data:
                return jsonify({"success": False, "message": "Record not found."}), 404

        return jsonify({"success": True, "message": "Saved successfully."})
    except Exception as error:
        print(f"CONTACT ERROR ({table}):", error)
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/api/customers", methods=["GET", "POST"])
@app.route("/api/customers/<int:item_id>", methods=["PUT"])
def customers_api(item_id=None):
    return contact_response("customers", "customer_name", item_id)


@app.route("/api/suppliers", methods=["GET", "POST"])
@app.route("/api/suppliers/<int:item_id>", methods=["PUT"])
def suppliers_api(item_id=None):
    return contact_response("suppliers", "supplier_name", item_id)


# =====================================================
# SALES
# =====================================================

@app.route("/api/sales", methods=["GET", "POST"])
def sales_api():
    auth_error = admin_required()
    if auth_error:
        return auth_error

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    try:
        if request.method == "GET":
            sales_res = supabase.table("sales").select("id, invoice_no, sale_date, total_amount, payment_method, customer_id").order("id", desc=True).execute()
            sales_list = sales_res.data or []

            # Pre-fetch customers, sale items, and products
            customers_res = supabase.table("customers").select("id, customer_name").execute()
            cust_map = {c["id"]: c["customer_name"] for c in (customers_res.data or [])}

            items_res = supabase.table("sale_items").select("sale_id, product_id, quantity").execute()
            products_res = supabase.table("products").select("id, product_name").execute()
            prod_map = {p["id"]: p["product_name"] for p in (products_res.data or [])}

            sale_items_map = {}
            for item in (items_res.data or []):
                sid = item.get("sale_id")
                pname = prod_map.get(item.get("product_id"), "Product")
                qty = item.get("quantity", 1)
                sale_items_map.setdefault(sid, []).append(f"{pname} × {qty}")

            formatted_sales = []
            total_sum = 0.0
            today_sum = 0.0
            today_str = date.today().isoformat()

            for s in sales_list:
                amt = float(s.get("total_amount") or 0)
                total_sum += amt
                s_date = str(s.get("sale_date") or "")
                if s_date.startswith(today_str):
                    today_sum += amt

                items_text = ", ".join(sale_items_map.get(s["id"], []))
                formatted_sales.append({
                    "id": s["id"],
                    "invoice_no": s.get("invoice_no"),
                    "sale_date": s.get("sale_date"),
                    "total_amount": amt,
                    "payment_method": s.get("payment_method"),
                    "customer_name": cust_map.get(s.get("customer_id"), "Walk-in"),
                    "products": items_text,
                    "quantity": len(sale_items_map.get(s["id"], []))
                })

            summary = {
                "total": round(total_sum, 2),
                "transactions": len(formatted_sales),
                "today": round(today_sum, 2)
            }
            return jsonify({"success": True, "sales": formatted_sales, "summary": summary})

        # POST: Record a new sale
        data = json_body()
        customer_id = data.get("customer_id")
        product_id = data.get("product_id")
        try:
            quantity = int(data.get("quantity", 0))
            price = float(data.get("price", 0))
        except (TypeError, ValueError):
            quantity, price = 0, 0
        payment = data.get("payment_method")

        if not customer_id or not product_id or quantity < 1 or price < 0 or payment not in ("Cash", "GCash", "Bank Transfer"):
            return jsonify({"success": False, "message": "Please provide a valid customer, product, quantity, price, and payment method."}), 400

        # Check product stock
        prod_res = supabase.table("products").select("id, product_name, stock").eq("id", product_id).limit(1).execute()
        if not prod_res.data:
            return jsonify({"success": False, "message": "Product not found."}), 404

        product = prod_res.data[0]
        if int(product.get("stock") or 0) < quantity:
            return jsonify({"success": False, "message": "Not enough stock for this sale."}), 400

        # Check customer
        cust_check = supabase.table("customers").select("id").eq("id", customer_id).limit(1).execute()
        if not cust_check.data:
            return jsonify({"success": False, "message": "Customer not found."}), 404

        total = round(quantity * price, 2)
        invoice = f"INV-{uuid.uuid4().hex[:6].upper()}"

        sale_insert = supabase.table("sales").insert({
            "invoice_no": invoice,
            "customer_id": customer_id,
            "user_id": session.get("user_id"),
            "total_amount": total,
            "payment_method": payment
        }).execute()

        sale_id = sale_insert.data[0]["id"]

        supabase.table("sale_items").insert({
            "sale_id": sale_id,
            "product_id": product_id,
            "quantity": quantity,
            "price": price,
            "subtotal": total
        }).execute()

        # Update product stock
        new_stock = int(product.get("stock") or 0) - quantity
        supabase.table("products").update({"stock": new_stock}).eq("id", product_id).execute()

        return jsonify({"success": True, "message": "Sale recorded successfully.", "invoice_no": invoice})
    except Exception as error:
        print("SALES API ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/api/sales/options", methods=["GET"])
def sale_options():
    auth_error = admin_required()
    if auth_error:
        return auth_error

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    try:
        cust_res = supabase.table("customers").select("id, customer_name").eq("status", "Active").order("customer_name").execute()
        prod_res = supabase.table("products").select("id, product_name, price, stock").gt("stock", 0).order("product_name").execute()

        products = prod_res.data or []
        for p in products:
            p["price"] = float(p.get("price") or 0)

        return jsonify({
            "success": True,
            "customers": cust_res.data or [],
            "products": products
        })
    except Exception as error:
        print("SALES OPTIONS ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


# =====================================================
# REPORTS
# =====================================================

@app.route("/api/reports", methods=["GET"])
def reports_api():
    auth_error = admin_required()
    if auth_error:
        return auth_error

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    start = request.args.get("start")
    end = request.args.get("end")

    try:
        sales_query = supabase.table("sales").select("id, invoice_no, customer_id, total_amount, payment_method, sale_date")
        if start:
            sales_query = sales_query.gte("sale_date", f"{start}T00:00:00")
        if end:
            sales_query = sales_query.lte("sale_date", f"{end}T23:59:59")

        sales_res = sales_query.order("sale_date", desc=True).execute()
        sales_list = sales_res.data or []
        sale_ids = [s["id"] for s in sales_list]

        # Customer & Product lookups
        cust_res = supabase.table("customers").select("id, customer_name").execute()
        cust_map = {c["id"]: c["customer_name"] for c in (cust_res.data or [])}

        prod_res = supabase.table("products").select("id, product_name, category, stock, price, reorder_level").execute()
        all_products = prod_res.data or []
        prod_map = {p["id"]: p for p in all_products}

        # Sale Items
        rows = []
        prod_qty_sold = {}
        cust_total_spent = {}

        if sale_ids:
            items_res = supabase.table("sale_items").select("sale_id, product_id, quantity, price, subtotal").in_("sale_id", sale_ids).execute()
            sale_map = {s["id"]: s for s in sales_list}

            for item in (items_res.data or []):
                s = sale_map.get(item.get("sale_id"))
                if not s:
                    continue
                c_name = cust_map.get(s.get("customer_id"), "Walk-in")
                p = prod_map.get(item.get("product_id"), {})
                p_name = p.get("product_name", "Unknown Product")
                qty = int(item.get("quantity") or 0)
                price = float(item.get("price") or 0)
                subtotal = float(item.get("subtotal") or 0)

                rows.append({
                    "sale_date": s.get("sale_date"),
                    "customer_name": c_name,
                    "product_name": p_name,
                    "quantity": qty,
                    "price": price,
                    "subtotal": subtotal
                })

                prod_qty_sold[p_name] = prod_qty_sold.get(p_name, 0) + qty
                cust_total_spent[c_name] = cust_total_spent.get(c_name, 0.0) + subtotal

        total_sales = sum(float(s.get("total_amount") or 0) for s in sales_list)
        products_sold = sum(r["quantity"] for r in rows)

        summary = {
            "total_sales": round(total_sales, 2),
            "transactions": len(sales_list),
            "products_sold": products_sold
        }

        top_products = [{"product_name": k, "quantity": v} for k, v in sorted(prod_qty_sold.items(), key=lambda x: x[1], reverse=True)[:5]]
        top_customers = [{"customer_name": k, "total": round(v, 2)} for k, v in sorted(cust_total_spent.items(), key=lambda x: x[1], reverse=True)[:5]]

        inventory = []
        for p in all_products:
            stock = int(p.get("stock") or 0)
            reorder = int(p.get("reorder_level") or 5)
            if stock == 0:
                status = "Out of Stock"
            elif stock <= reorder:
                status = "Low Stock"
            else:
                status = "Available"

            inventory.append({
                "product_name": p.get("product_name"),
                "category": p.get("category"),
                "stock": stock,
                "price": float(p.get("price") or 0),
                "reorder_level": reorder,
                "stock_status": status
            })

        return jsonify({
            "success": True,
            "rows": rows,
            "summary": summary,
            "top_products": top_products,
            "top_customers": top_customers,
            "inventory": inventory
        })
    except Exception as error:
        print("REPORTS ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


# =====================================================
# CUSTOMER SHOP & ORDERS
# =====================================================

@app.route("/api/customer/orders", methods=["GET"])
def customer_orders():
    auth_error = login_required()
    if auth_error:
        return auth_error
    if session.get("role") != "Customer":
        return jsonify({"success": False, "message": "Customer access is required."}), 403

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    try:
        cust_res = supabase.table("customers").select("id").eq("email", session["email"]).limit(1).execute()
        customers = cust_res.data or []
        if not customers:
            return jsonify({"success": True, "orders": []})

        customer_id = customers[0]["id"]
        sales_res = supabase.table("sales").select("id, invoice_no, sale_date, total_amount, payment_method").eq("customer_id", customer_id).order("id", desc=True).execute()
        sales_list = sales_res.data or []

        sale_ids = [s["id"] for s in sales_list]
        items_map = {}
        if sale_ids:
            items_res = supabase.table("sale_items").select("sale_id, product_id, quantity").in_("sale_id", sale_ids).execute()
            products_res = supabase.table("products").select("id, product_name").execute()
            p_map = {p["id"]: p["product_name"] for p in (products_res.data or [])}

            for item in (items_res.data or []):
                sid = item.get("sale_id")
                pname = p_map.get(item.get("product_id"), "Product")
                qty = item.get("quantity", 1)
                items_map.setdefault(sid, []).append(f"{pname} × {qty}")

        orders = []
        for s in sales_list:
            orders.append({
                "invoice_no": s.get("invoice_no"),
                "sale_date": s.get("sale_date"),
                "total_amount": float(s.get("total_amount") or 0),
                "payment_method": s.get("payment_method"),
                "products": ", ".join(items_map.get(s["id"], []))
            })

        return jsonify({"success": True, "orders": orders})
    except Exception as error:
        print("CUSTOMER ORDERS ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


@app.route("/api/customer/checkout", methods=["POST"])
def customer_checkout():
    auth_error = login_required()
    if auth_error:
        return auth_error
    if session.get("role") != "Customer":
        return jsonify({"success": False, "message": "Customer access is required."}), 403

    data = request.get_json(silent=True) or {}
    items = data.get("items", [])
    payment_method = data.get("payment_method", "Cash")

    if not isinstance(items, list) or not items:
        return jsonify({"success": False, "message": "Your cart is empty."}), 400
    if payment_method not in ("Cash", "GCash", "Bank Transfer"):
        return jsonify({"success": False, "message": "Choose a valid payment method."}), 400

    quantities = {}
    try:
        for item in items:
            product_id = int(item["product_id"])
            quantity = int(item["quantity"])
            if quantity < 1:
                raise ValueError
            quantities[product_id] = quantities.get(product_id, 0) + quantity
    except (KeyError, TypeError, ValueError):
        return jsonify({"success": False, "message": "Your cart contains an invalid quantity."}), 400

    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({"success": False, "message": "Database connection failed."}), 500

    try:
        cust_res = supabase.table("customers").select("id").eq("email", session["email"]).limit(1).execute()
        customers = cust_res.data or []
        if not customers:
            # Create a customer profile automatically if missing
            create_cust = supabase.table("customers").insert({
                "customer_name": session.get("fullname", "Valued Customer"),
                "email": session["email"],
                "status": "Active"
            }).execute()
            customer_id = create_cust.data[0]["id"]
        else:
            customer_id = customers[0]["id"]

        cart_lines = []
        total = 0.0

        for product_id, quantity in quantities.items():
            prod_res = supabase.table("products").select("id, product_name, stock, price").eq("id", product_id).limit(1).execute()
            if not prod_res.data:
                return jsonify({"success": False, "message": "A product in your cart is no longer available."}), 400

            product = prod_res.data[0]
            stock = int(product.get("stock") or 0)
            if stock < quantity:
                return jsonify({"success": False, "message": f"Only {stock} of {product.get('product_name')} remain."}), 400

            subtotal = round(float(product.get("price") or 0) * quantity, 2)
            total += subtotal
            cart_lines.append((product, quantity, subtotal))

        invoice_no = f"WEB-{uuid.uuid4().hex[:8].upper()}"
        sale_insert = supabase.table("sales").insert({
            "invoice_no": invoice_no,
            "customer_id": customer_id,
            "user_id": session.get("user_id"),
            "total_amount": round(total, 2),
            "payment_method": payment_method
        }).execute()

        sale_id = sale_insert.data[0]["id"]

        for product, quantity, subtotal in cart_lines:
            supabase.table("sale_items").insert({
                "sale_id": sale_id,
                "product_id": product["id"],
                "quantity": quantity,
                "price": float(product["price"]),
                "subtotal": subtotal
            }).execute()

            # Deduct stock
            new_stock = int(product.get("stock") or 0) - quantity
            supabase.table("products").update({"stock": new_stock}).eq("id", product["id"]).execute()

        return jsonify({"success": True, "message": "Order placed successfully.", "invoice_no": invoice_no})
    except Exception as error:
        print("CUSTOMER CHECKOUT ERROR:", error)
        return jsonify({"success": False, "message": str(error)}), 500


# =====================================================
# SYSTEM & HEALTH CHECK
# =====================================================

@app.route("/test-db")
def test_db():
    supabase = get_supabase_client()
    if supabase is None:
        return jsonify({
            "status": "error",
            "message": "Supabase client not initialized. Ensure SUPABASE_URL and SUPABASE_KEY are set in Render/Environment."
        }), 500

    try:
        res = supabase.table("users").select("id", count="exact").execute()
        return jsonify({
            "status": "connected",
            "provider": "Supabase (Cloud PostgreSQL)",
            "message": "Database is successfully connected!",
            "users_count": len(res.data or [])
        })
    except Exception as error:
        return jsonify({
            "status": "error",
            "message": f"Database query failed: {str(error)}",
            "hint": "Have you executed database/supabase_setup.sql in your Supabase SQL Editor?"
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
