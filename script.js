/* =========================================================
   PARK//AI
   Smart Parking Allocation Engine
   ========================================================= */


/* ---------------------------------------------------------
   PARKING ENVIRONMENT
--------------------------------------------------------- */

const parkingSlots = [

    {
        id: "P-01",
        type: "Normal",
        distance: 20,
        sizes: ["Small", "Medium"],
        occupied: true
    },

    {
        id: "P-02",
        type: "Normal",
        distance: 30,
        sizes: ["Small", "Medium", "Large"],
        occupied: false
    },

    {
        id: "P-03",
        type: "EV",
        distance: 40,
        sizes: ["Small", "Medium", "Large"],
        occupied: false
    },

    {
        id: "P-04",
        type: "Accessible",
        distance: 50,
        sizes: ["Medium", "Large"],
        occupied: false,
        reserved: true
    },

    {
        id: "P-05",
        type: "Normal",
        distance: 25,
        sizes: ["Small", "Medium"],
        occupied: true
    },

    {
        id: "P-06",
        type: "EV",
        distance: 35,
        sizes: ["Small", "Medium", "Large"],
        occupied: false
    },

    {
        id: "P-07",
        type: "Normal",
        distance: 45,
        sizes: ["Small", "Medium", "Large"],
        occupied: false
    },

    {
        id: "P-08",
        type: "Accessible",
        distance: 55,
        sizes: ["Medium", "Large"],
        occupied: false,
        reserved: true
    },

    {
        id: "P-09",
        type: "Normal",
        distance: 60,
        sizes: ["Small", "Medium", "Large"],
        occupied: true
    },

    {
        id: "P-10",
        type: "EV",
        distance: 65,
        sizes: ["Small", "Medium", "Large"],
        occupied: false
    },

    {
        id: "P-11",
        type: "Normal",
        distance: 70,
        sizes: ["Small", "Medium"],
        occupied: false
    },

    {
        id: "P-12",
        type: "Normal",
        distance: 75,
        sizes: ["Medium", "Large"],
        occupied: true
    },

    {
        id: "P-13",
        type: "Accessible",
        distance: 80,
        sizes: ["Medium", "Large"],
        occupied: false,
        reserved: true
    },

    {
        id: "P-14",
        type: "EV",
        distance: 85,
        sizes: ["Small", "Medium", "Large"],
        occupied: false
    },

    {
        id: "P-15",
        type: "Normal",
        distance: 90,
        sizes: ["Small", "Medium", "Large"],
        occupied: false
    },

    {
        id: "P-16",
        type: "Normal",
        distance: 95,
        sizes: ["Medium", "Large"],
        occupied: false
    }

];


/* ---------------------------------------------------------
   VARIABLES
--------------------------------------------------------- */

let selectedSize = "Small";

let vehicleQueue = [];

let allocationHistory = [];

let currentlySelectedSlot = null;

let isAllocating = false;


/* ---------------------------------------------------------
   INITIALIZATION
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

    renderParkingGrid();

    updateStatistics();

    setupSizeButtons();

});


/* ---------------------------------------------------------
   SIZE BUTTONS
--------------------------------------------------------- */

function setupSizeButtons() {

    const buttons = document.querySelectorAll(".size-btn");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            buttons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            selectedSize = button.dataset.size;

        });

    });

}


/* ---------------------------------------------------------
   RENDER PARKING GRID
--------------------------------------------------------- */

function renderParkingGrid() {

    const grid = document.getElementById("parkingGrid");

    grid.innerHTML = "";

    parkingSlots.forEach(slot => {

        const element = document.createElement("div");

        element.className = "parking-slot";

        if (slot.occupied) {
            element.classList.add("occupied");
        } else {
            element.classList.add("available");
        }

        if (slot.type === "EV") {
            element.classList.add("ev");
        }

        if (slot.type === "Accessible") {
            element.classList.add("accessible");
        }

        element.dataset.slot = slot.id;


        let typeSymbol = "";

        if (slot.type === "EV") {
            typeSymbol = "ϟ";
        }

        else if (slot.type === "Accessible") {
            typeSymbol = "♿";
        }

        else {
            typeSymbol = "·";
        }


        element.innerHTML = `

            <span class="slot-number">
                ${slot.id}
            </span>

            <span class="slot-type">
                ${typeSymbol}
            </span>

            <div class="slot-car"></div>

            <span class="slot-distance">
                ${slot.distance}m
            </span>

        `;


        grid.appendChild(element);

    });

}


/* ---------------------------------------------------------
   UPDATE STATISTICS
--------------------------------------------------------- */

function updateStatistics() {

    const total = parkingSlots.length;

    const occupied = parkingSlots.filter(
        slot => slot.occupied
    ).length;

    const available = total - occupied;

    const ev = parkingSlots.filter(
        slot => slot.type === "EV" && !slot.occupied
    ).length;


    document.getElementById("totalSlots").textContent = total;

    document.getElementById("availableSlots").textContent = available;

    document.getElementById("occupiedSlots").textContent = occupied;

    document.getElementById("evSlots").textContent = ev;

}


/* ---------------------------------------------------------
   GET VEHICLE
--------------------------------------------------------- */

function getVehicleFromForm() {

    return {

        id:
            document.getElementById("vehicleId").value.trim()
            || "CAR-01",

        type:
            document.getElementById("vehicleType").value,

        size:
            selectedSize,

        ev:
            document.getElementById("evRequired").checked,

        accessible:
            document.getElementById("accessibleRequired").checked

    };

}


/* ---------------------------------------------------------
   CHECK SLOT
--------------------------------------------------------- */

function checkSlot(vehicle, slot) {

    if (slot.occupied) {

        return {
            valid: false,
            reason: "Already occupied"
        };

    }


    if (
        slot.reserved &&
        !vehicle.accessible
    ) {

        return {
            valid: false,
            reason: "Reserved space"
        };

    }


    if (
        vehicle.ev &&
        slot.type !== "EV"
    ) {

        return {
            valid: false,
            reason: "EV charging required"
        };

    }


    if (
        vehicle.accessible &&
        slot.type !== "Accessible"
    ) {

        return {
            valid: false,
            reason: "Accessible space required"
        };

    }


    if (
        !slot.sizes.includes(vehicle.size)
    ) {

        return {
            valid: false,
            reason: "Vehicle size mismatch"
        };

    }


    return {
        valid: true,
        reason: "Suitable"
    };

}


/* ---------------------------------------------------------
   SLOT SCORE
--------------------------------------------------------- */

function calculateScore(vehicle, slot) {

    let score = 100;


    /*
       Distance
       Closer spaces receive a better score.
    */

    score -= slot.distance * 0.22;


    /*
       Exact preference matches
    */

    if (vehicle.ev && slot.type === "EV") {
        score += 25;
    }


    if (
        vehicle.accessible &&
        slot.type === "Accessible"
    ) {
        score += 35;
    }


    /*
       Normal spaces are preferred when
       no special requirement exists.
    */

    if (
        !vehicle.ev &&
        !vehicle.accessible &&
        slot.type === "Normal"
    ) {
        score += 8;
    }


    /*
       Slight preference for spaces
       with more vehicle flexibility.
    */

    if (slot.sizes.length === 3) {
        score += 2;
    }


    return Math.max(0, Math.min(100, score));

}


/* ---------------------------------------------------------
   GET VALID SPACES
--------------------------------------------------------- */

function getValidSpaces(vehicle) {

    return parkingSlots
        .map(slot => {

            const result = checkSlot(
                vehicle,
                slot
            );

            if (!result.valid) {
                return null;
            }


            return {

                slot: slot,

                score: calculateScore(
                    vehicle,
                    slot
                )

            };

        })

        .filter(Boolean)

        .sort(
            (a, b) =>
                b.score - a.score
        );

}


/* ---------------------------------------------------------
   FIND PARKING
--------------------------------------------------------- */

async function findParking() {

    if (isAllocating) {
        return;
    }

    isAllocating = true;


    const button =
        document.getElementById("findButton");


    button.classList.add("loading");

    button.querySelector("span").textContent =
        "CHECKING AVAILABLE SPACES...";


    const vehicle =
        getVehicleFromForm();


    clearSelectedSlot();


    updateAssist(
        "Scanning the parking environment..."
    );


    setDecisionState(
        "Checking spaces",
        "..."
    );


    /*
       Small delay makes the interface
       feel like a live intelligent system.
    */

    await wait(700);


    updateAssist(
        "Comparing available spaces..."
    );


    await wait(700);


    const validSpaces =
        getValidSpaces(vehicle);


    if (validSpaces.length === 0) {

        setDecisionState(
            "No suitable space",
            "—"
        );

        updateAssist(
            "No suitable space is currently available."
        );

        showToast(
            "No space found",
            "Try changing the vehicle requirements."
        );

        resetFindButton();

        isAllocating = false;

        return;

    }


    const best =
        validSpaces[0];


    currentlySelectedSlot =
        best.slot.id;


    highlightSlot(
        best.slot.id
    );


    updateDecision(
        vehicle,
        best
    );


    await wait(500);


    updateAssist(
        `Best space found: ${best.slot.id}`
    );


    await animateCarToSlot(
        best.slot
    );


    assignSlot(
        vehicle,
        best.slot
    );


    addHistory(
        vehicle,
        best.slot,
        best.score
    );


    showToast(
        `${best.slot.id} selected`,
        `${vehicle.id} has been assigned a parking space.`
    );


    resetFindButton();

    isAllocating = false;

}


/* ---------------------------------------------------------
   UPDATE DECISION PANEL
--------------------------------------------------------- */

function updateDecision(vehicle, result) {

    const slot = result.slot;


    document.getElementById(
        "decisionTitle"
    ).textContent =
        "Space found";


    document.getElementById(
        "decisionNumber"
    ).textContent =
        slot.id.replace("P-", "");


    document.getElementById(
        "selectedSlotName"
    ).textContent =
        slot.id;


    document.getElementById(
        "matchPercent"
    ).textContent =
        Math.round(result.score) + "%";


    document.getElementById(
        "decisionPlaceholder"
    ).classList.add("hidden");


    document.getElementById(
        "decisionResult"
    ).classList.remove("hidden");


    const reasons =
        document.getElementById("reasonList");


    let reasonOne =
        `${slot.distance}m from the entrance`;

    let reasonTwo =
        `${slot.type} space`;

    let reasonThree =
        `${vehicle.size} vehicle compatible`;


    if (vehicle.ev) {
        reasonTwo =
            "EV charging available";
    }


    if (vehicle.accessible) {
        reasonTwo =
            "Accessible space selected";
    }


    reasons.innerHTML = `

        <div>
            <span>01</span>
            <p>${reasonOne}</p>
        </div>

        <div>
            <span>02</span>
            <p>${reasonTwo}</p>
        </div>

        <div>
            <span>03</span>
            <p>${reasonThree}</p>
        </div>

    `;


    document
        .querySelector(".decision-visual")
        .classList.add("active");

}


/* ---------------------------------------------------------
   SET DECISION STATE
--------------------------------------------------------- */

function setDecisionState(
    title,
    number
) {

    document.getElementById(
        "decisionTitle"
    ).textContent = title;


    document.getElementById(
        "decisionNumber"
    ).textContent = number;

}


/* ---------------------------------------------------------
   HIGHLIGHT SLOT
--------------------------------------------------------- */

function highlightSlot(slotId) {

    clearSelectedSlot();


    const slot =
        document.querySelector(
            `[data-slot="${slotId}"]`
        );


    if (slot) {
        slot.classList.add("selected");
    }

}


/* ---------------------------------------------------------
   CLEAR SLOT
--------------------------------------------------------- */

function clearSelectedSlot() {

    document
        .querySelectorAll(".parking-slot.selected")
        .forEach(slot => {
            slot.classList.remove("selected");
        });

}


/* ---------------------------------------------------------
   REAL CAR MOVEMENT
--------------------------------------------------------- */

async function animateCarToSlot(slot) {

    const car =
        document.getElementById("movingCar");

    const route =
        document.getElementById("routeLight");


    car.classList.add("visible");

    route.classList.add("active");


    updateAssist(
        `Driving toward ${slot.id}...`
    );


    /*
       The car moves through several stages.
       This creates a real route-like movement
       instead of simply appearing in the slot.
    */


    const parkingElement =
        document.querySelector(
            `[data-slot="${slot.id}"]`
        );


    if (!parkingElement) {
        return;
    }


    const area =
        document.querySelector(".parking-area");


    const areaRect =
        area.getBoundingClientRect();


    const slotRect =
        parkingElement.getBoundingClientRect();


    const targetX =
        slotRect.left +
        slotRect.width / 2 -
        (areaRect.left + areaRect.width / 2);


    const targetY =
        slotRect.top +
        slotRect.height / 2 -
        (areaRect.top + areaRect.height / 2);


    /*
       Stage 1:
       enter from bottom
    */

    await animateElement(
        car,
        [
            {
                transform:
                    "translateY(520px)"
            },
            {
                transform:
                    "translateY(350px)"
            }
        ],
        700
    );


    /*
       Stage 2:
       move through central lane
    */

    await animateElement(
        car,
        [
            {
                transform:
                    "translateY(350px)"
            },
            {
                transform:
                    "translateY(0)"
            }
        ],
        900
    );


    /*
       Stage 3:
       move horizontally toward slot
    */

    await animateElement(
        car,
        [
            {
                transform:
                    "translateX(0)"
            },
            {
                transform:
                    `translateX(${targetX}px)`
            }
        ],
        700
    );


    /*
       Stage 4:
       move toward actual slot
    */

    await animateElement(
        car,
        [
            {
                transform:
                    `translateX(${targetX}px)`
            },
            {
                transform:
                    `translateX(${targetX}px) translateY(${targetY}px)`
            }
        ],
        650
    );


    await wait(400);


    car.classList.remove("visible");

    route.classList.remove("active");


    updateAssist(
        `${slot.id} reached. Parking complete.`
    );

}


/* ---------------------------------------------------------
   ELEMENT ANIMATION HELPER
--------------------------------------------------------- */

function animateElement(
    element,
    keyframes,
    duration
) {

    return new Promise(resolve => {

        const animation =
            element.animate(
                keyframes,
                {
                    duration,
                    easing:
                        "cubic-bezier(.65,0,.25,1)",
                    fill: "forwards"
                }
            );


        animation.onfinish =
            () => resolve();

    });

}


/* ---------------------------------------------------------
   ASSIGN SLOT
--------------------------------------------------------- */

function assignSlot(
    vehicle,
    slot
) {

    slot.occupied = true;

    slot.assignedTo =
        vehicle.id;


    renderParkingGrid();

    updateStatistics();


    updateDecisionAfterAssignment(
        slot,
        vehicle
    );

}


/* ---------------------------------------------------------
   FINAL DECISION STATE
--------------------------------------------------------- */

function updateDecisionAfterAssignment(
    slot,
    vehicle
) {

    document.getElementById(
        "decisionTitle"
    ).textContent =
        "Parking complete";


    updateAssist(
        `${vehicle.id} is safely parked in ${slot.id}.`
    );

}


/* ---------------------------------------------------------
   ADD VEHICLE QUEUE
--------------------------------------------------------- */

function addVehicleToQueue() {

    const vehicle =
        getVehicleFromForm();


    vehicle.id =
        vehicle.id ||
        `CAR-${vehicleQueue.length + 1}`;


    vehicleQueue.push(vehicle);


    renderVehicleQueue();


    updateAssist(
        `${vehicle.id} added to the parking queue.`
    );

}


/* ---------------------------------------------------------
   RENDER QUEUE
--------------------------------------------------------- */

function renderVehicleQueue() {

    const container =
        document.getElementById("vehicleQueue");


    const count =
        document.getElementById("queueCount");


    count.textContent =
        vehicleQueue.length;


    if (vehicleQueue.length === 0) {

        container.innerHTML = `

            <div class="empty-queue">

                <div>＋</div>

                <span>No vehicles waiting</span>

                <small>
                    Add vehicles to allocate spaces together.
                </small>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    vehicleQueue.forEach(
        (vehicle, index) => {

            const item =
                document.createElement("div");


            item.className =
                "queue-item";


            item.innerHTML = `

                <div class="queue-number">
                    ${String(index + 1).padStart(2, "0")}
                </div>

                <div class="queue-info">

                    <strong>
                        ${vehicle.id}
                    </strong>

                    <span>
                        ${vehicle.type}
                        •
                        ${vehicle.size}
                        ${vehicle.ev ? " • EV" : ""}
                        ${vehicle.accessible ? " • ACCESS" : ""}
                    </span>

                </div>

                <button
                    class="remove-queue"
                    onclick="removeQueueVehicle(${index})"
                >
                    ×
                </button>

            `;


            container.appendChild(item);

        }
    );

}


/* ---------------------------------------------------------
   REMOVE QUEUE VEHICLE
--------------------------------------------------------- */

function removeQueueVehicle(index) {

    vehicleQueue.splice(index, 1);

    renderVehicleQueue();

}


/* ---------------------------------------------------------
   ALLOCATE ALL
--------------------------------------------------------- */

async function allocateAllVehicles() {

    if (
        vehicleQueue.length === 0
    ) {

        showToast(
            "Queue is empty",
            "Add vehicles before allocating."
        );

        return;

    }


    if (isAllocating) {
        return;
    }


    isAllocating = true;


    updateAssist(
        "Planning spaces for all vehicles..."
    );


    await wait(700);


    /*
       Work on a copy.
       Vehicles are assigned one by one.
       If an earlier choice blocks a later vehicle,
       another compatible space is attempted.
    */

    const vehicles =
        [...vehicleQueue];


    const result =
        allocateWithBacktracking(
            vehicles,
            0,
            []
        );


    if (!result.success) {

        updateAssist(
            "A complete allocation could not be created."
        );


        showToast(
            "Allocation incomplete",
            "There are not enough suitable spaces."
        );


        isAllocating = false;

        return;

    }


    /*
       Animate each assignment.
    */

    for (
        const allocation of result.allocations
    ) {

        highlightSlot(
            allocation.slot.id
        );


        updateDecision(
            allocation.vehicle,
            {
                slot: allocation.slot,
                score: allocation.score
            }
        );


        await animateCarToSlot(
            allocation.slot
        );


        assignSlot(
            allocation.vehicle,
            allocation.slot
        );


        addHistory(
            allocation.vehicle,
            allocation.slot,
            allocation.score
        );


        await wait(400);

    }


    vehicleQueue = [];


    renderVehicleQueue();


    updateAssist(
        "All queued vehicles have been assigned."
    );


    showToast(
        "Allocation complete",
        "All suitable vehicles received spaces."
    );


    isAllocating = false;

}


/* ---------------------------------------------------------
   BACKTRACKING ALLOCATION
--------------------------------------------------------- */

function allocateWithBacktracking(
    vehicles,
    index,
    allocations
) {

    if (
        index >= vehicles.length
    ) {

        return {
            success: true,
            allocations
        };

    }


    const vehicle =
        vehicles[index];


    const candidates =
        getValidSpaces(vehicle);


    for (
        const candidate of candidates
    ) {

        const slot =
            candidate.slot;


        /*
           Temporarily reserve the slot.
        */

        slot.occupied = true;


        allocations.push({

            vehicle,

            slot,

            score:
                candidate.score

        });


        const result =
            allocateWithBacktracking(
                vehicles,
                index + 1,
                allocations
            );


        if (result.success) {

            return result;

        }


        /*
           Undo the temporary reservation.
        */

        slot.occupied = false;

        allocations.pop();

    }


    return {
        success: false
    };

}


/* ---------------------------------------------------------
   HISTORY
--------------------------------------------------------- */

function addHistory(
    vehicle,
    slot,
    score
) {

    allocationHistory.unshift({

        vehicle:
            vehicle.id,

        type:
            vehicle.type,

        slot:
            slot.id,

        score:
            Math.round(score),

        time:
            new Date()

    });


    renderHistory();

}


/* ---------------------------------------------------------
   RENDER HISTORY
--------------------------------------------------------- */

function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );


    if (
        allocationHistory.length === 0
    ) {

        container.innerHTML = `
            <div class="no-history">
                No parking decisions yet.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    allocationHistory
        .slice(0, 8)
        .forEach(item => {

            const element =
                document.createElement("div");


            element.className =
                "history-item";


            element.innerHTML = `

                <div class="history-icon">
                    ✓
                </div>

                <div class="history-info">

                    <strong>
                        ${item.vehicle}
                    </strong>

                    <span>
                        ${item.type}
                        •
                        ${item.score}% match
                    </span>

                </div>

                <div class="history-slot">
                    ${item.slot}
                </div>

                <div class="history-time">
                    ${formatTime(item.time)}
                </div>

            `;


            container.appendChild(element);

        });

}


/* ---------------------------------------------------------
   FORMAT TIME
--------------------------------------------------------- */

function formatTime(date) {

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* ---------------------------------------------------------
   ASSIST MESSAGE
--------------------------------------------------------- */

function updateAssist(message) {

    document.getElementById(
        "assistMessage"
    ).textContent = message;

}


/* ---------------------------------------------------------
   RESET BUTTON
--------------------------------------------------------- */

function resetFindButton() {

    const button =
        document.getElementById(
            "findButton"
        );


    button.classList.remove(
        "loading"
    );


    button.querySelector(
        "span"
    ).textContent =
        "FIND MY PARKING SPACE";

}


/* ---------------------------------------------------------
   TOAST
--------------------------------------------------------- */

function showToast(
    title,
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    document.getElementById(
        "toastTitle"
    ).textContent =
        title;


    document.getElementById(
        "toastMessage"
    ).textContent =
        message;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 3500);

}


/* ---------------------------------------------------------
   NAVIGATION
--------------------------------------------------------- */

function scrollToFinder() {

    document
        .getElementById("finder")
        .scrollIntoView({
            behavior: "smooth"
        });

}


function scrollToMap() {

    document
        .getElementById("parkingMap")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* ---------------------------------------------------------
   WAIT
--------------------------------------------------------- */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}