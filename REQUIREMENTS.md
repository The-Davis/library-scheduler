# General Code Requirements

The application must run locally using Node.js for testing. The code should use Typescript.

The application must be able to run on a static HTML pages via Github Pages with no supporting configuration beyond the initial setup.

The application must require no assets beyond a single HTML file, a single CSS file, and compiled Typescript or Javascript files.

# General Application Requirements

The application must be able to accept a month and year as inputs for its scheduling base. The application must accept and optional seed number for initial random generation of shift filling, but given an initial seed the calculations should be deterministic and repeatable.

The application must be able to accept a "shifts" CSV file describing the shift requirements for each day of the month. The properties of a shift will be described later.

The application must be able to accept an "employees" CSV file listing the employees who can fill the shifts. The properties of an employee will be described later.

The application must visually present a calendar with the shift coverage. The calendar should be able to dynamically size for a desktop, laptop, tablet, or mobile phone browser. The calendar should display with crisp lines, easy to read fonts, and visually pleasing colors.

# Definition of a Day

A day has consistent opening and closing hours.
Monday-Thursday always opens at 9 and closes at 21
Friday and Saturday opens at 9 and closes at 18
Each day can accept shift types and numbers as inputs.

Example:
Monday requires 12 hours of shifts with a Person in Charge, Accounts, and Info
Monday requires 8 hours of Welcome and Float
This means that viable mixes would be two full time employees acting as Person in Charge with overlap in the middle of the day,
while Accounts could be two part time employees at six hours each, or three part time employees at four hours each.
See shift definitions for staffing requirements per shift type.

# Defition of a Shift

A shift has a staff category requirement, and an hours minimum and maximum requirement. Use classes and subclasses to define shifts.
Any shift requiring a fulltime employee must consist of eight hours.
Part time can only be 4, 6, or 8 hours.
Programming is a special class of shift.

Ensure the process for defining shift sub-classes is very easy for future feature development.

By default each day, the following shifts are required:
PIC - FT All day (two shifts on weekdays)
Accounts - All day
Info - All day
Welcome - Only until 6
Float - Only until 6
Support - Monday through Friday only until 6
Float Saturday only until 2
The CSV input will overwrite this if present for the given day.
Programming varies. It is usually 2 each day every day and one on some Saturdays, so programming should only be placed when it is present in the CSV input, it should not appear by default.


# Definition of an Employee

Each employee has an employment status: Part Time, Programming, or Full Time.
Each employee has a minimum and maximum hours per week.
A full time employee is always minimum AND maximum 40 hours per week.
Each employee may have "not available days" where they should not be scheduled.
Each employee may have "preferred days" where placing them should be scored higher than alternatives.
Each employee may have unavailable hours per day where they should not be scheduled.
Each employee may have "preferred hours" where placing them should be scored higher than alternatives.
Each employee may have "preferred coworkers" where the algorithm should favor pairing the employees in a given shift.
Each employee may have "preferred stay-away-from coworkers" where the algorithm should disfavor pairing the employees in a given shift.
Each employee may specify a preference for days when they prefer to close then open (i.e. last shift of a day followed by first shift of a day) or prefer not to. By default, the algorithm should favor avoiding back to back shifts.

# Algorithm Requirements

Treat days and shift requirements as slots to be filled given the staffing and hour requirements.
Always fill full time shifts with full time employees.
Always give full time employees 40 hours per week.
Always give part time employees at least 12 hours per week.
Use bonus value and penalty rankings to score each placement, adding and subtracting modifiers for the preferences defined in the definition of an employee section.

# Proof of Concept

Generate a demonstration month using September 2026. Populate it with the default shifts listed in Definition of a Shift.
Generate a demonstration employee roster consisting of four full time and twenty-one part time randomly-generated employees.
