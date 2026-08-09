```javascript
// ===============================
// ARAZEL COMMAND CENTER
// app.js
// ===============================


// --------------------------------
// Login
// --------------------------------

function login() {

    const username =
        document.getElementById("u").value.trim();

    const password =
        document.getElementById("p").value;

    const error =
        document.getElementById("err");


    if (!username || !password) {

        error.style.color = "#ff4b4b";

        error.textContent =
            "نام کاربری و رمز عبور را وارد کنید.";

        return;
    }


    /*
     * فعلاً ورود محلی است.
     *
     * برای ورود واقعی باید این قسمت
     * به API بک‌اند وصل شود.
     */

    error.textContent = "";

    document.getElementById("login")
        .classList.add("hide");

    document.getElementById("app")
        .classList.remove("hide");


    if (typeof updateStats === "function") {
        updateStats();
    }

}


// --------------------------------
// Register
// --------------------------------

async function register() {

    const username =
        document.getElementById("u").value.trim();

    const password =
        document.getElementById("p").value;

    const error =
        document.getElementById("err");


    if (!username || !password) {

        error.style.color = "#ff4b4b";

        error.textContent =
            "نام کاربری و رمز عبور را وارد کنید.";

        return;
    }


    if (password.length < 6) {

        error.style.color = "#ff4b4b";

        error.textContent =
            "رمز عبور باید حداقل ۶ کاراکتر باشد.";

        return;
    }


    /*
     * این آدرس را باید با آدرس API واقعی
     * بک‌اند خودت جایگزین کنی.
     *
     * مثال:
     *
     * https://example.com/api/register
     */

    const API_URL = "/api/register";


    try {

        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    username: username,

                    password: password

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "ثبت‌نام انجام نشد."
            );

        }


        error.style.color = "#00d26a";

        error.textContent =
            data.message ||
            "اکانت با موفقیت ساخته شد.";


    } catch (err) {

        /*
         * اگر API هنوز ساخته نشده باشد،
         * این پیام نمایش داده می‌شود.
         */

        error.style.color = "#ff4b4b";

        error.textContent =
            "اتصال به سرور ثبت‌نام برقرار نشد.";

        console.error(
            "Register error:",
            err
        );

    }

}


// --------------------------------
// Logout
// --------------------------------

function logout() {

    document.getElementById("app")
        .classList.add("hide");

    document.getElementById("login")
        .classList.remove("hide");


    const username =
        document.getElementById("u");

    const password =
        document.getElementById("p");

    if (username) {
        username.value = "";
    }

    if (password) {
        password.value = "";
    }

}


// --------------------------------
// Navigation
// --------------------------------

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(function(element) {

            element.classList.add("hide");

        });


    const selected =
        document.getElementById(page);


    if (selected) {

        selected.classList.remove("hide");

    }


    const titles = {

        dashboard: "داشبورد",

        members: "Members",

        ranks: "Ranks",

        teamspeak: "TeamSpeak Log",

        locker: "Locker Log",

        gang: "Gang Log",

        tickets: "Requests"

    };


    const title =
        document.getElementById("title");


    if (title) {

        title.textContent =
            titles[page] || "Arazel";

    }

}


// --------------------------------
// Members
// --------------------------------

function newMember() {

    const form =
        document.getElementById("memberForm");


    if (!form) return;


    form.classList.remove("hide");


    form.innerHTML = `

        <h3>عضو جدید</h3>

        <input
            id="newMemberName"
            placeholder="نام"
        >

        <input
            id="newMemberRank"
            placeholder="رنک"
        >

        <button
            onclick="addMember()"
        >
            ذخیره عضو
        </button>

    `;

}


function addMember() {

    const nameElement =
        document.getElementById(
            "newMemberName"
        );


    const rankElement =
        document.getElementById(
            "newMemberRank"
        );


    if (!nameElement) return;


    const name =
        nameElement.value.trim();


    const rank =
        rankElement
            ? rankElement.value.trim()
            : "";


    if (!name) {

        alert(
            "نام عضو را وارد کنید."
        );

        return;

    }


    const table =
        document.getElementById(
            "members"
        );


    if (!table) return;


    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>
            ${escapeHtml(name)}
        </td>

        <td>
            ${escapeHtml(rank)}
        </td>

        <td>
            -
        </td>

        <td>
            0
        </td>

        <td>
            0
        </td>

        <td>
            Active
        </td>

        <td>
            <button
                onclick="this.closest('tr').remove(); updateStats();"
            >
                حذف
            </button>
        </td>

    `;


    table.appendChild(row);


    const form =
        document.getElementById(
            "memberForm"
        );


    if (form) {

        form.classList.add("hide");

    }


    updateStats();

}


// --------------------------------
// Dashboard statistics
// --------------------------------

function updateStats() {

    const members =
        document.querySelectorAll(
            "#members tr"
        );


    const memberCount =
        document.getElementById("sm");


    if (memberCount) {

        memberCount.textContent =
            members.length;

    }

}


// --------------------------------
// Ranks
// --------------------------------

function saveRanks() {

    alert(
        "رنک‌ها ذخیره شدند."
    );

}


// --------------------------------
// Logs
// --------------------------------

function logModal(type) {

    const modal =
        document.getElementById(
            "modal"
        );


    if (!modal) return;


    modal.classList.remove("hide");


    const category =
        document.getElementById("lc");


    if (category) {

        category.value = type;

    }


    const title =
        document.getElementById("mt");


    if (title) {

        title.textContent =
            type + " Log";

    }

}


function closeModal() {

    const modal =
        document.getElementById(
            "modal"
        );


    if (modal) {

        modal.classList.add("hide");

    }

}


function saveLog() {

    const type =
        document.getElementById(
            "lc"
        )?.value;


    const actor =
        document.getElementById(
            "la"
        )?.value.trim();


    const subject =
        document.getElementById(
            "ls"
        )?.value.trim();


    const action =
        document.getElementById(
            "lx"
        )?.value.trim();


    if (!actor && !subject && !action) {

        closeModal();

        return;

    }


    const target =
        document.getElementById(
            type + "logs"
        );


    if (target) {

        const item =
            document.createElement(
                "p"
            );


        item.textContent =
            `${actor || "-"} — ${subject || "-"} — ${action || "-"}`;


        target.prepend(item);

    }


    closeModal();

}


// --------------------------------
// HTML safety
// --------------------------------

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// --------------------------------
// Start
// --------------------------------

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateStats();

    }
);
```
