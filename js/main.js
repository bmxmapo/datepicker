// cellContents should be created based on backend output

var cellContents = {
    'Airport 1': {
        '2017-11-17': {
            'Price': [579, 590],
            'Time': ['12:34', '12:55'],
            'Active': [true, false]
        },
        '2017-11-25': {
            'Price': [1579, 590],
            'Time': ['20:10', '12:55'],
            'Active': [true, true]
        },
        '2017-11-26': {
            'Price': [1579],
            'Time': ['20:10'],
            'Active': [false]
        },
        '2017-12-24': {
            'Price': [7235],
            'Time': ['20:30'],
            'Active': [true]
        }
    },
    'Copenhagen': {
        '2017-11-24': {
            'Price': [579, 590],
            'Time': ['12:34', '12:55'],
            'Active': [true, false]
        },
        '2017-11-25': {
            'Price': [1579, 590],
            'Time': ['20:10', '12:55'],
            'Active': [true, true]
        },
        '2017-12-10': {
            'Price': [1579],
            'Time': ['20:10'],
            'Active': [false]
        },
        '2017-12-12': {
            'Price': [7235],
            'Time': ['20:30'],
            'Active': [true]
        }
    }
};

// Current month and month array declaration, to use in external navigation for datepicker

var activeMonth = new Date().getMonth() + 1;
var monthsArray = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

// Used for getDate(), which has Sunday as 0-index item.

var fullDayNamesArray = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

// Empty variables to be overwritten elsewhere, declared here to have them in global scope.

var activeDates = [];
var selectedDate = '';
var dateFrom = '';
var dateTo = '';

// Travel duration; should be pulled from Magento, based on current product configuration.

var duration = 7;

// Cache DOM elements for future use

var airportWidget = $('#calendar');
var airportSelect = $("#calendar-travel-options");
var airportContainer = $('#calendar-airports');

// Populate airport dropdown selection and pick either Copenhagen or first as initially selected

var airportList = Object.keys(cellContents);

for (var airport in airportList) {
    if (airport == 0) {
        var option = '<option value="' + airportList[airport] + '" selected="selected" class="airport-initial">' + airportList[airport] + '</option>';
    } else {
        var option = '<option value="' + airportList[airport] + '">' + airportList[airport] + '</option>';
    }

    airportSelect.append(option);
}

// If Copenhagen exist in options, make that one default select, not the first list item (client request)

$("option", airportSelect).each(function () {
    if ($(this).val() == "Copenhagen") {
        $(this).parent().find(".airport-initial").removeAttr("selected").removeClass("airport-initial");
        $(this).attr("selected", "selected").addClass("airport-initial");
    }
});

// Trigger datepicker creation.

var currentAirport = airportSelect.val();
createDatepicker(currentAirport);

// Regenerate datepicker widget on changing in airport dropdown.

airportSelect.on("change", function () {
    $('#calendar').datepicker("destroy");
    currentAirport = airportSelect.val();
    createDatepicker(currentAirport);
    resetNavigation();
    updateDatePickerCells();
});

// Initiate jQuery UI Datepicker on a block element.

function createDatepicker(key) {

    // Get dates for cellContents object and clear the container under the widget

    activeDates = Object.keys(cellContents[key]);
    airportContainer.html('');

    airportWidget.datepicker({
        dateFormat: "yy-mm-dd",
        dayNamesMin: ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"],
        firstDay: 1,
        maxDate: "+7m",
        minDate: 0,
        nextText: "Næste",
        prevText: "Tidligere",
        showOtherMonths: true,
        onSelect: function (date, dp) {
            updateDatePickerCells();
            updatePriceField(dp);
        },
        onChangeMonthYear: function (year, month, dp) {
            activeMonth = month;
            updateDatePickerCells();
            updateMonthControls();
            if (selectedDate != '') {
                showTravelDuration(selectedDate);
            }
        },
        beforeShow: function (elem, dp) {
            updateDatePickerCells();
        },
        beforeShowDay: function (date) {

            // Add custom class to each to differentiate all fields.

            // Retrieves current day, prepends 0 and removes -2nd character (returns 2-digit day)

            var currentDay = (0 + date.getDate().toString()).slice(-2);

            // Month is zero-indexed, so we increment by 1, change to string, prepend 0 and remove -2nd char

            var currentMonth = (0 + (date.getMonth() + 1).toString()).slice(-2);
            var currentYear = date.getFullYear();
            var currentDate = currentYear + "-" + currentMonth + "-" + currentDay;

            // Disable all day fields except those that are present in CellContents list.

            if (activeDates.indexOf(currentDate) >= 0) {
                return [true, 'date-active datepicker-' + currentDate];
            } else {
                return [false, 'datepicker-' + currentDate];
            }
        }
    });

    $("#calendar-input").val('');
    $("#calendar-price").val('');
}

// Resetting arrow and month navigation

var calendarControls = $("#calendar-controls");

function resetNavigation() {
    $(".month-nav-hidden", calendarControls).removeClass("month-nav-hidden");
    $(".month-active", calendarControls).removeClass("month-active");
    $("#prev", calendarControls).addClass("month-nav-hidden");
    $(".month-control", calendarControls).addClass("month-hidden").filter(":lt(3)").removeClass("month-hidden").eq(0).addClass("month-active");
}

// Create price fields for days in calendar.

updateDatePickerCells();

function updateDatePickerCells() {

    // Wait until current callstack is finished so the datepicker is fully rendered before attempting to modify contents

    setTimeout(function () {

        // Code below should be integrated after backend work is done, on ajax success.

        $('#calendar-style-container').html("");

        for (var cellDate in cellContents[currentAirport]) {
            var cellPriceArray = [];

            // Determine if any travel options are still active (Active: true), and add either lowest price or Undsolgt (sold-out) to date cell

            for (var cellPrice in cellContents[currentAirport][cellDate]["Price"]) {
                if (cellContents[currentAirport][cellDate]["Active"][cellPrice]) {
                    cellPriceArray.push(cellContents[currentAirport][cellDate]["Price"][cellPrice]);
                }
            }

            if (cellPriceArray.length <= 0) {
                $('.ui-datepicker td.datepicker-' + cellDate).addClass('ui-datepicker-unselectable ui-state-disabled sold-out').removeClass("date-active");
                var rule = '.ui-datepicker td.datepicker-' + cellDate + ' > *:after {content: "Udsolgt";}';
            } else {
                var cellMinPrice = Math.min.apply(null, cellPriceArray).toString();

                $('.ui-datepicker td.datepicker-' + cellDate).data('price', cellMinPrice);

                // Add a "." (to mark thousands in bigger prices) to cellPrice before adding it to calendar

                if (cellMinPrice.length > 3) {
                    cellMinPrice = cellMinPrice.slice(0, -3) + "." + cellMinPrice.slice(-3);
                }

                var rule = '.ui-datepicker td.datepicker-' + cellDate + ' > *:after {content: "' + cellMinPrice + ',-";}';
            }
            $('#calendar-style-container').append('<style>' + rule + '</style>');
        }

    }, 0);
}

// Update travel options container based on data-price fields.

function updatePriceField(dp) {

    // dp is jQuery UI object of corresponding field in calendar. We create YYYY-MM-DD formatted date based on it.

    selectedDate = dp.selectedYear + "-" + (0 + (parseInt(dp.selectedMonth) + 1).toString()).slice(-2) + "-" + dp.selectedDay;
    var activePrice = $('.ui-datepicker td.datepicker-' + selectedDate).data('price');

    // Empty the airport list container

    airportContainer.html('');

    // Create a airport list items for each airport and append it to #calendar-airports

    var selectedDateInfo = cellContents[currentAirport][selectedDate];

    for (var currentInfo in selectedDateInfo["Price"]) {
        var airportDetails = airportDetailsContainer(currentAirport, selectedDate, selectedDateInfo["Price"][currentInfo].toString(), selectedDateInfo["Time"][currentInfo], selectedDateInfo["Active"][currentInfo]);
        airportContainer.append(airportDetails);
    }

    // Add event to buttons in airport list items


    airportContainer.on('click', 'button', function (e) {
        e.preventDefault();
        var clickedDate = $(this).parent().data('date');
        var clickedAirport = $(this).parent().data('airport');
        var clickedIndex = cellContents[clickedAirport][clickedDate]["Time"].indexOf($(this).parent().data("time"));
        calendarPopup(clickedDate, clickedAirport, clickedIndex);
    });

    showTravelDuration(selectedDate)
}

function showTravelDuration(date) {

    // Display the duration of vacation product (but first wait for the elements to re-render)

    setTimeout(function () {

        $('.ui-datepicker td').removeClass("date-travel-duration");

        // Add corresponding class to all following days based on "duration" value

        for (i = 0; i < duration; i++) {

            var durationDate = new Date(date);
            durationDate.setDate(durationDate.getDate() + i);
            var travelDate = durationDate.getFullYear() + "-" + (0 + (durationDate.getMonth() + 1).toString()).slice(-2) + "-" + (0 + durationDate.getDate().toString()).slice(-2);

            $('.ui-datepicker td.datepicker-' + travelDate).addClass("date-travel-duration");
        }
    }, 0);
}

// Populating calendar Popup and events for closing and opening it.

var popupContainer = $("#calendar-popup-container ");

popupContainer.click(function () {
    $(this).fadeOut();
});

$(".calendar-popup").click(function (e) {
    e.stopPropagation();
});

$(".calendar-popup-close").click(function () {
    popupContainer.fadeOut();
});


function calendarPopup(date, airport, index) {

    // Get all data for corresponding Airport and Date from the source.

    var calendarData = cellContents[airport][date];

    // Create Date() object from date input, for easier manipulation

    var dateRaw = new Date(date);

    // Get full day of the week and add dateFrom (see airportDetailsContainer()). Then add duration days to our Date() object and do the same for dateTo

    var dateFromString = fullDayNamesArray[dateRaw.getDay()] + " " + dateFrom;
    dateRaw.setDate(dateRaw.getDate() + (duration - 1));
    var dateToString = fullDayNamesArray[dateRaw.getDay()] + " " + dateTo;

    // Add values to DOM

    $(".airport-name span").html(airport);
    $(".airport-date-from").html(dateFromString);
    $(".airport-date-to").html(dateToString);
    $(".airport-time").html(calendarData['Time'][index]);

    popupContainer.fadeIn();
}

// Function for building a single airport list item to append to the #caledanr-airports. Formatted inefficiently for easier manipulation :)

function airportDetailsContainer(name, date, price, time, active) {

    // Check if this field is active and remove disabled status from the button if true

    var disabled = 'disabled="disabled"';
    var label = 'Udsolgt';

    if (active) {
        disabled = '';
        label = 'Buy';
    }

    // Calculate dates for travel duration. Create Date() object to easily manipulate it. Populate dateFrom/dateTo to use in calendarPopup()

    var dateRaw = new Date(date);
    dateFrom = (0 + dateRaw.getDate().toString()).slice(-2) + "/" + (0 + (dateRaw.getMonth() + 1).toString()).slice(-2);
    dateRaw.setDate(dateRaw.getDate() + (duration - 1));
    dateTo = (0 + dateRaw.getDate().toString()).slice(-2) + "/" + (0 + (dateRaw.getMonth() + 1).toString()).slice(-2);

    // Add a period delimiter to price

    if (price.length > 3) {
        price = price.slice(0, -3) + "." + price.slice(-3);
    }

    // Create airport list item based on the data sent and processed above

    return '<div class="airport-container" data-airport="' + name + '" data-date="' + date + '" data-time="' + time + '">' +
        '<div class="airport-info">' +
        '<p class="travel-duration">Tirs ' + dateFrom + ' - ' + dateTo + '</span></p>' +
        '<p>Din pris <span class="airport-price">' + price + ',- </span></p>' +
        '</div>' +
        '<button ' + disabled + '>' + label + '</button>' +
        '</div>';
}

// External navigation header arrows

$('#next, #prev', calendarControls).on('click', function (e) {
    $('.ui-datepicker-' + e.target.id).trigger("click");
});

// Swipe navigation for mobiles

$("#calendar-form").on("swipeleft", function () {
    $('.ui-datepicker-next').trigger("click");
});

$("#calendar-form").on("swiperight", function () {
    $('.ui-datepicker-prev').trigger("click");
});

// External navigation with month names

$('.month-control').each(function () {

    // Get month indexes and add specific class (for css changes), data-month (for changing function) and html content for navigations

    var index = parseInt($(this).data('month-index')) + activeMonth;
    var yearMod = 0;

    if (index > 12) {
        index -= 12;
        yearMod = 1;
    }

    $(this).addClass('month-control-' + (index)).data('month', index).html(monthsArray[index - 1]);

    // Month navigation on click

    $(this).click(function () {
        if ($(this).data('month') != activeMonth) {
            var targetDay = new Date().getDate();
            var targetMonth = index.toString();
            var targetYear = new Date().getFullYear() + yearMod;
            var targetDate = targetYear + "-" + targetMonth + "-" + targetDay;
            airportWidget.datepicker('setDate', targetDate);
        }
    });
});

// Arrow and month navigation class changing

function updateMonthControls() {
    var activeControl = $('.month-control.month-control-' + activeMonth);

    // Change active month

    $('.month-control').removeClass("month-active");
    activeControl.addClass("month-active");

    // Hide/show other months, based on active month siblings

    if (activeControl.hasClass("month-hidden")) {
        activeControl.removeClass("month-hidden");
        if (activeControl.prev().hasClass("month-hidden") || activeControl.prev().attr("id") == "prev") {
            activeControl.nextUntil("#next").addClass("month-hidden").filter(":lt(2)").removeClass("month-hidden");
        } else if (activeControl.next().hasClass("month-hidden") || activeControl.next().attr("id") == "next") {
            activeControl.prevUntil("#prev").addClass("month-hidden").filter(":lt(2)").removeClass("month-hidden");
        }
    }

    // Hide/show arrows if active month is the first or last one in

    if ($(".month-control.month-first").hasClass("month-active")) {
        $("#prev", calendarControls).addClass("month-nav-hidden");
    } else {
        $("#prev", calendarControls).removeClass("month-nav-hidden");
    }

    if ($(".month-control.month-last").hasClass("month-active")) {
        $("#next", calendarControls).addClass("month-nav-hidden");
    } else {
        $("#next", calendarControls).removeClass("month-nav-hidden");
    }
}

// TO BE DELETED

$('#raw-input').html(JSON.stringify(cellContents));
