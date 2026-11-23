document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // MODAL HELPERS
    // =====================================================

    const messageModal =
        document.getElementById("messageModal");

    const messageModalTitle =
        document.getElementById("messageModalTitle");

    const messageModalText =
        document.getElementById("messageModalText");

    const closeMessageModal =
        document.getElementById("closeMessageModal");

    const messageModalOK =
        document.getElementById("messageModalOK");


    function showMessage(title, message) {

        if (!messageModal) {
            console.log(title, message);
            return;
        }

        messageModalTitle.textContent = title;
        messageModalText.textContent = message;

        messageModal.style.display = "flex";
        messageModal.classList.add("open");
    }


    function hideMessage() {

        if (!messageModal) return;

        messageModal.classList.remove("open");
        messageModal.style.display = "none";
    }


    if (closeMessageModal) {

        closeMessageModal.addEventListener(
            "click",
            hideMessage
        );

    }


    if (messageModalOK) {

        messageModalOK.addEventListener(
            "click",
            hideMessage
        );

    }


    // =====================================================
    // LOGIN
    // =====================================================

    const loginForm =
        document.getElementById("loginForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const email =
                    document.getElementById(
                        "email"
                    ).value.trim();

                const password =
                    document.getElementById(
                        "password"
                    ).value;


                if (!email || !password) {

                    showMessage(
                        "Login",
                        "Please enter your email and password."
                    );

                    return;
                }


                try {

                    const response =
                        await fetch(
                            "/api/login",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    email: email,
                                    password: password
                                })
                            }
                        );


                    const result =
                        await response.json();


                    if (result.success) {

                        window.location.href =
                            result.user.role === "Customer"
                                ? "/shop"
                                : "/dashboard";

                    } else {

                        showMessage(
                            "Login Failed",
                            result.message ||
                            "Invalid email or password."
                        );

                    }

                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    showMessage(
                        "Connection Error",
                        "Unable to connect to the server."
                    );
                }

            }
        );
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                try {

                    const response =
                        await fetch(
                            "/api/logout",
                            {
                                method: "POST"
                            }
                        );


                    const result =
                        await response.json();


                    if (result.success) {

                        window.location.href =
                            "/login";

                    } else {

                        showMessage(
                            "Logout",
                            result.message ||
                            "Logout failed."
                        );

                    }

                } catch (error) {

                    showMessage(
                        "Connection Error",
                        "Unable to connect to the server."
                    );

                }

            }
        );
    }


    // =====================================================
    // CUSTOMER REGISTRATION
    // =====================================================

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        const registerMessage = document.getElementById("registerMessage");
        const showRegisterMessage = function (message, isError) {
            if (!registerMessage) {
                showMessage("Create Account", message);
                return;
            }
            registerMessage.textContent = message;
            registerMessage.style.display = "block";
            registerMessage.style.color = isError ? "#ff2e7e" : "#7fcf2e";
        };
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const password = document.getElementById("regPassword").value;
            if (password !== document.getElementById("regConfirm").value) {
                showRegisterMessage("Passwords do not match.", true);
                return;
            }
            const submitButton = registerForm.querySelector("button[type='submit']");
            submitButton.disabled = true;
            showRegisterMessage("Creating your customer account…", false);
            try {
                const response = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fullname: document.getElementById("fullName").value.trim(),
                        email: document.getElementById("regEmail").value.trim(),
                        phone: document.getElementById("regPhone").value.trim(),
                        password: password
                    })
                });
                const result = await response.json();
                if (result.success) {
                    showRegisterMessage("Account created. Redirecting you to login…", false);
                    setTimeout(function () { window.location.href = "/login"; }, 700);
                } else {
                    showRegisterMessage(result.message || "Unable to create your account.", true);
                }
            } catch (error) {
                showRegisterMessage("Unable to reach the server. Start the Flask app, then try again.", true);
            } finally {
                submitButton.disabled = false;
            }
        });
    }


    // =====================================================
    // ADD PRODUCT
    // =====================================================

    const addStickerForm =
        document.getElementById(
            "addStickerForm"
        );


    if (addStickerForm) {

        addStickerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const formData =
                    new FormData(
                        addStickerForm
                    );


                try {

                    const response =
                        await fetch(
                            "/api/products",
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    const result =
                        await response.json();


                    if (result.success) {

                        closeAddModal();

                        showMessage(
                            "Success",
                            "Service added successfully!"
                        );


                        addStickerForm.reset();


                        setTimeout(
                            loadProducts,
                            500
                        );

                    } else {

                        showMessage(
                            "Unable to Add Service",
                            result.message ||
                            "Failed to add service."
                        );

                    }

                } catch (error) {

                    console.error(
                        "Add product error:",
                        error
                    );

                    showMessage(
                        "Connection Error",
                        "Unable to connect to the server."
                    );

                }

            }
        );
    }


    // =====================================================
    // ADD MODAL
    // =====================================================

    const openAddSticker =
        document.getElementById(
            "openAddSticker"
        );

    const addStickerOverlay =
        document.getElementById(
            "addStickerOverlay"
        );

    const closeAddSticker =
        document.getElementById(
            "closeAddSticker"
        );


    function closeAddModal() {

        if (!addStickerOverlay) return;

        addStickerOverlay.classList.remove(
            "open"
        );

        addStickerOverlay.style.display =
            "none";
    }


    if (openAddSticker) {

        openAddSticker.addEventListener(
            "click",
            function () {

                addStickerOverlay.style.display =
                    "flex";

                addStickerOverlay.classList.add(
                    "open"
                );

            }
        );

    }


    if (closeAddSticker) {

        closeAddSticker.addEventListener(
            "click",
            closeAddModal
        );

    }


    // =====================================================
    // IMAGE PREVIEW - ADD
    // =====================================================

    const productImage =
        document.getElementById(
            "prodImage"
        );

    const imagePreview =
        document.getElementById(
            "imagePreview"
        );


    if (productImage) {

        productImage.addEventListener(
            "change",
            function () {

                if (!imagePreview) return;

                imagePreview.innerHTML = "";


                const file =
                    productImage.files[0];


                if (!file) return;


                if (!file.type.startsWith("image/")) {

                    showMessage(
                        "Invalid Image",
                        "Please select an image file."
                    );

                    productImage.value = "";

                    return;
                }


                const image =
                    document.createElement("img");


                image.src =
                    URL.createObjectURL(file);


                image.style.width = "150px";
                image.style.height = "150px";
                image.style.objectFit = "cover";
                image.style.borderRadius = "10px";
                image.style.marginTop = "10px";


                imagePreview.appendChild(
                    image
                );

            }
        );
    }


    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    async function loadProducts() {

        const tableBody =
            document.querySelector(
                "#productsTable tbody"
            );


        if (!tableBody) return;


        try {

            const response =
                await fetch(
                    "/api/products"
                );


            const result =
                await response.json();


            if (!result.success) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            ${result.message}
                        </td>
                    </tr>
                `;

                return;
            }


            const products =
                result.products;


            tableBody.innerHTML = "";


            if (!products.length) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            No services found.
                        </td>
                    </tr>
                `;

                return;
            }


            products.forEach(function (product) {

                const row =
                    document.createElement("tr");


                let imageHTML;


                if (product.image) {

                    imageHTML = `
                        <img
                            src="/uploads/${product.image}"
                            alt="${escapeHTML(product.product_name)}"
                            style="
                                width:100%;
                                height:100%;
                                object-fit:cover;
                            "
                        >
                    `;

                } else {

                    imageHTML = `
                        <div class="no-image">
                            🏷
                        </div>
                    `;

                }


                const stockClass =
                    Number(product.stock) <=
                    Number(product.reorder_level)
                        ? "low"
                        : "";


                row.innerHTML = `

                    <td>

                        <div class="cell-product">

                            <div class="thumb">

                                ${imageHTML}

                            </div>

                            <div>

                                <div class="cell-name">
                                    ${escapeHTML(product.product_name)}
                                </div>

                                <div class="cell-sku">
                                    ${escapeHTML(product.sku || "")}
                                </div>

                            </div>

                        </div>

                    </td>


                    <td>

                        <span class="chip">

                            ${escapeHTML(product.category || "")}

                        </span>

                    </td>


                    <td class="price-cell">

                        ₱${Number(
                            product.price
                        ).toFixed(2)}

                    </td>


                    <td class="stock-cell ${stockClass}">

                        ${product.stock}

                    </td>


                    <td>

                        <div class="row-actions">

                            <button
                                class="icon-btn"
                                title="Edit"
                                data-id="${product.id}">
                                ✎
                            </button>

                            <button
                                class="icon-btn danger"
                                title="Delete"
                                data-id="${product.id}"
                                data-name="${escapeHTML(product.product_name)}">
                                🗑
                            </button>

                        </div>

                    </td>

                `;


                const editButton =
                    row.querySelector(
                        ".icon-btn:not(.danger)"
                    );


                const deleteButton =
                    row.querySelector(
                        ".icon-btn.danger"
                    );


                editButton.addEventListener(
                    "click",
                    function () {

                        openEditModal(product);

                    }
                );


                deleteButton.addEventListener(
                    "click",
                    function () {

                        openDeleteModal(
                            product.id,
                            product.product_name
                        );

                    }
                );


                tableBody.appendChild(row);

            });


        } catch (error) {

            console.error(
                "Load products error:",
                error
            );


            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load services.
                    </td>
                </tr>
            `;

        }

    }


    // =====================================================
    // SEARCH
    // =====================================================

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                const search =
                    searchInput.value
                        .toLowerCase()
                        .trim();


                const rows =
                    document.querySelectorAll(
                        "#productsTable tbody tr"
                    );


                rows.forEach(function (row) {

                    const text =
                        row.textContent
                            .toLowerCase();


                    row.style.display =
                        text.includes(search)
                            ? ""
                            : "none";

                });

            }
        );

    }


    // =====================================================
    // EDIT MODAL
    // =====================================================

    const editOverlay =
        document.getElementById(
            "editStickerOverlay"
        );

    const editForm =
        document.getElementById(
            "editStickerForm"
        );

    const closeEditSticker =
        document.getElementById(
            "closeEditSticker"
        );


    function openEditModal(product) {

        if (!editOverlay) return;


        document.getElementById(
            "editProductId"
        ).value = product.id;


        document.getElementById(
            "editProdName"
        ).value = product.product_name;


        document.getElementById(
            "editProdSku"
        ).value = product.sku;


        document.getElementById(
            "editProdCategory"
        ).value = product.category;


        document.getElementById(
            "editProdDesc"
        ).value =
            product.description || "";


        document.getElementById(
            "editProdPrice"
        ).value = product.price;


        document.getElementById(
            "editProdStock"
        ).value = product.stock;


        document.getElementById(
            "editProdReorder"
        ).value =
            product.reorder_level;


        const preview =
            document.getElementById(
                "editImagePreview"
            );


        if (preview) {

            if (product.image) {

                preview.innerHTML = `
                    <img
                        src="/uploads/${product.image}"
                        style="
                            width:150px;
                            height:150px;
                            object-fit:cover;
                            border-radius:10px;
                            margin-top:10px;
                        "
                    >
                `;

            } else {

                preview.innerHTML =
                    "<p>No image</p>";

            }

        }


        editOverlay.style.display =
            "flex";

        editOverlay.classList.add(
            "open"
        );

    }


    function closeEditModal() {

        if (!editOverlay) return;

        editOverlay.classList.remove(
            "open"
        );

        editOverlay.style.display =
            "none";

    }


    if (closeEditSticker) {

        closeEditSticker.addEventListener(
            "click",
            closeEditModal
        );

    }


    // =====================================================
    // EDIT IMAGE PREVIEW
    // =====================================================

    const editImage =
        document.getElementById(
            "editProdImage"
        );


    if (editImage) {

        editImage.addEventListener(
            "change",
            function () {

                const file =
                    editImage.files[0];


                if (!file) return;


                if (!file.type.startsWith("image/")) {

                    showMessage(
                        "Invalid Image",
                        "Please select a valid image."
                    );

                    editImage.value = "";

                    return;

                }


                const preview =
                    document.getElementById(
                        "editImagePreview"
                    );


                if (!preview) return;


                preview.innerHTML = "";


                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    URL.createObjectURL(file);


                img.style.width = "150px";
                img.style.height = "150px";
                img.style.objectFit = "cover";
                img.style.borderRadius = "10px";
                img.style.marginTop = "10px";


                preview.appendChild(img);

            }
        );

    }


    // =====================================================
    // SAVE EDIT
    // =====================================================

    if (editForm) {

        editForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const id =
                    document.getElementById(
                        "editProductId"
                    ).value;


                const formData =
                    new FormData(
                        editForm
                    );


                try {

                    const response =
                        await fetch(
                            `/api/products/${id}`,
                            {
                                method: "PUT",
                                body: formData
                            }
                        );


                    const result =
                        await response.json();


                    if (result.success) {

                        closeEditModal();


                        showMessage(
                            "Success",
                            "Service updated successfully!"
                        );


                        setTimeout(
                            loadProducts,
                            500
                        );

                    } else {

                        showMessage(
                            "Unable to Edit Service",
                            result.message ||
                            "Failed to update service."
                        );

                    }


                } catch (error) {

                    console.error(
                        "Edit error:",
                        error
                    );


                    showMessage(
                        "Connection Error",
                        "Unable to connect to the server."
                    );

                }

            }
        );

    }


    // =====================================================
    // DELETE MODAL
    // =====================================================

    const deleteModal =
        document.getElementById(
            "deleteModal"
        );

    const deleteProductName =
        document.getElementById(
            "deleteProductName"
        );

    const confirmDelete =
        document.getElementById(
            "confirmDelete"
        );

    const cancelDelete =
        document.getElementById(
            "cancelDelete"
        );

    const closeDeleteModalButton =
        document.getElementById(
            "closeDeleteModal"
        );


    let productToDelete = null;


    function openDeleteModal(
        id,
        name
    ) {

        productToDelete = id;


        if (deleteProductName) {

            deleteProductName.textContent =
                name;

        }


        if (deleteModal) {

            deleteModal.style.display =
                "flex";

            deleteModal.classList.add(
                "open"
            );

        }

    }


    function closeDeleteModal() {

        productToDelete = null;


        if (!deleteModal) return;


        deleteModal.classList.remove(
            "open"
        );

        deleteModal.style.display =
            "none";

    }


    if (cancelDelete) {

        cancelDelete.addEventListener(
            "click",
            closeDeleteModal
        );

    }


    if (closeDeleteModalButton) {

        closeDeleteModalButton.addEventListener(
            "click",
            closeDeleteModal
        );

    }


    if (confirmDelete) {

        confirmDelete.addEventListener(
            "click",
            async function () {

                if (!productToDelete) return;


                try {

                    confirmDelete.disabled =
                        true;


                    const response =
                        await fetch(
                            `/api/products/${productToDelete}`,
                            {
                                method: "DELETE"
                            }
                        );


                    const result =
                        await response.json();


                    if (result.success) {

                        closeDeleteModal();


                        showMessage(
                            "Success",
                            "Service deleted successfully!"
                        );


                        setTimeout(
                            loadProducts,
                            500
                        );

                    } else {

                        showMessage(
                            "Unable to Delete Service",
                            result.message ||
                            "Failed to delete service."
                        );

                    }


                } catch (error) {

                    console.error(
                        "Delete error:",
                        error
                    );


                    showMessage(
                        "Connection Error",
                        "Unable to connect to the server."
                    );

                } finally {

                    confirmDelete.disabled =
                        false;

                }

            }
        );

    }


    // =====================================================
    // DASHBOARD
    // =====================================================

    async function loadDashboardData() {

        const totalProducts =
            document.getElementById(
                "totalProducts"
            );

        const totalCustomers =
            document.getElementById(
                "totalCustomers"
            );

        const totalSales =
            document.getElementById(
                "totalSales"
            );


        if (
            !totalProducts &&
            !totalCustomers &&
            !totalSales
        ) {

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/dashboard"
                );


            const result =
                await response.json();


            if (!result.success) {

                console.error(
                    result.message
                );

                return;

            }


            const data =
                result.data;


            if (totalProducts) {

                totalProducts.textContent =
                    data.total_products ?? 0;

            }


            if (totalCustomers) {

                totalCustomers.textContent =
                    data.total_customers ?? 0;

            }


            if (totalSales) {

                totalSales.textContent =
                    "₱" +
                    Number(
                        data.total_sales ?? 0
                    ).toFixed(2);

            }


            // LOW STOCK

            const lowStock =
                document.getElementById(
                    "lowStock"
                );

            const lowStockList =
                document.getElementById(
                    "lowStockList"
                );


            if (lowStock) {

                lowStock.textContent =
                    `${data.low_stock ?? 0} items`;

            }


            if (lowStockList) {

                lowStockList.innerHTML = "";


                if (
                    !data.low_stock_products ||
                    data.low_stock_products.length === 0
                ) {

                    lowStockList.innerHTML =
                        "<p>No low stock products.</p>";

                } else {

                    data.low_stock_products.forEach(
                        function (product) {

                            const item =
                                document.createElement(
                                    "div"
                                );

                            item.className =
                                "stock-item";

                            item.innerHTML = `
                                <span>
                                    ${escapeHTML(
                                        product.product_name
                                    )}
                                </span>

                                <strong>
                                    ${product.stock}
                                </strong>
                            `;

                            lowStockList.appendChild(
                                item
                            );

                        }
                    );

                }

            }


            // RECENT TRANSACTIONS

            const transactions =
                document.getElementById(
                    "recentTransactions"
                );


            if (transactions) {

                transactions.innerHTML = "";


                if (
                    !data.recent_transactions ||
                    data.recent_transactions.length === 0
                ) {

                    transactions.innerHTML =
                        "<p>No recent transactions.</p>";

                } else {

                    data.recent_transactions.forEach(
                        function (transaction) {

                            const item =
                                document.createElement(
                                    "div"
                                );

                            item.className =
                                "transaction-item";

                            item.innerHTML = `
                                <span>
                                    ${escapeHTML(
                                        transaction.customer_name
                                    )}
                                </span>

                                <strong>
                                    ₱${Number(
                                        transaction.total_amount
                                    ).toFixed(2)}
                                </strong>
                            `;

                            transactions.appendChild(
                                item
                            );

                        }
                    );

                }

            }


        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

        }

    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(value) {

        if (value === null ||
            value === undefined) {

            return "";

        }


        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // =====================================================
    // START
    // =====================================================

    loadProducts();

    loadDashboardData();

});
