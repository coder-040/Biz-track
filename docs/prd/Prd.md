BizTrack — Product Requirements Document
Version 1.1 · Web-based SaaS application · MVP release
1. Title and Field
Product title: BizTrack — Business Finance and Inventory Tracker
Field / domain: Small-business management software (finance, credit tracking and inventory) for retail and wholesale shops in Nepal.
Product type: Responsive web application (desktop, tablet, mobile browser).
2. Problem Statement
Small retail and wholesale business owners (stationery, grocery and hardware shops, small distributors) run their daily finances, customer credit (Udharo), supplier payments and stock using notebooks, calculators and spreadsheets.
This causes the following problems:
• Owners do not know their true daily financial position (cash, bank, money owed to them, money they owe).
• Customer credit is spread across notebook pages, so balances are hard to verify and overdue amounts are forgotten.
• Supplier and dealer payments are delayed or missed because due dates are not tracked in one place.
• Stock records are inaccurate, and owners discover shortages only when a customer asks for a product that is not on the shelf.
• There is no single view of the overall business condition, so decisions rest on memory and guesswork.
• Records are easy to alter or lose, and there is no history of who changed what.
3. Personas and Pain Points
Persona 1: Ram, the Shop Owner (primary)
Profile: Owns a stationery or grocery shop, handles purchasing, pricing and cash himself, and gives credit to regular customers.
Pain points:
• Cannot say at the end of the day how much he earned or spent.
• Forgets which customers owe money and how much.
• Misses supplier due dates and risks losing credit terms.
• Runs out of fast-selling items without warning.
Persona 2: Sita, the Shop Manager / Cashier (secondary)
Profile: Works the counter, records sales and receives stock deliveries, but should not see all financial data.
Pain points:
• Has to check the owner or a notebook to find a customer's balance.
• Stock counts on paper do not match the shelf.
• Unsure which actions she is permitted to perform.
Persona 3: Hari, the Wholesale Distributor (secondary)
Profile: Sells in bulk to many retailers on credit and buys from several dealers.
Pain points:
• Many customers with partial payments make balances hard to track.
• Large inventory with frequent stock movement is difficult to value.
• Needs reports for his accountant at month end.
Persona 4: Small-Business Accountant (secondary)
Profile: Prepares periodic summaries for several small shops.
Pain points:
• Receives incomplete or inconsistent records.
• Spends time re-entering notebook data into spreadsheets.
4. Goals and Success Metrics
#
Goal
Success metric (MVP)
1
Make daily recordkeeping simple
A new user can record a transaction in under 1 minute; a new business can register and add its first product in under 10 minutes.
2
Reduce forgotten customer and supplier payments
100% of payments past their due date appear as overdue alerts; overdue lists are accurate against test data.
3
Improve inventory visibility
Stock levels update correctly after every purchase, sale, damage or adjustment; 100% of items at or below threshold trigger a low-stock alert.
4
Give owners a clear financial position
Dashboard totals (income, expense, cash, bank, receivables, payables, inventory value) match underlying transactions exactly.
5
Replace notebooks and spreadsheets
Reports (daily, monthly, outstanding, inventory) match transactions and export to CSV/Excel without errors.
Overall MVP success: five team members can test the complete system (registration through reports) without major integration errors.
5. MVP Scope vs Future Phase
MVP (first release)
1.  Dashboard
2.  Income and expense management, with categories, payment methods, optional bill attachment, and edit/delete with audit history
3.  Supplier/dealer payment management (purchases, partial payments, balances, due dates)
4.  Inventory management (products, stock in/out, damaged or lost stock, manual adjustments, movement history, inventory value)
5.  Low-stock alerts
6.  Overdue payment alerts (in-app only)
7.  Basic reports with date filtering and CSV/Excel export
Future phase (not in first release)
• AI business insights
• WhatsApp and SMS reminders, email notifications
• Barcode scanning
• Thermal receipt printing
• Multiple shop branches
• Advanced accounting
• Tax/VAT reporting
• Offline-first functionality
• Native mobile applications
Non-functional requirements (apply to MVP)
• Responsive design for desktop, tablet and mobile
• Secure authentication and role-based access control
• Strict data isolation: no business can access another business's records
• Data validation and automatic calculations
• Fast search and filtering
• Audit history for important financial and inventory changes
• Regular data backups
6. User Stories and Acceptance Criteria
Authentication and Setup
US-1: As an owner, I want to register and create my business account so that my data is kept separate and secure.
• Given valid details, when I register, then a business account and an Owner/Admin user are created.
• Given I am logged in, then I can only see my own business's data.
• Given incorrect credentials, then login is refused with a clear message.
US-2: As an owner, I want to add staff with limited permissions so that employees can work without seeing everything.
• Given I am an Owner/Admin, when I add a staff user and assign permissions, then that user can only access the permitted features.
• Given I am Staff, when I open a restricted page, then access is denied.
Dashboard
US-3: As an owner, I want one dashboard so that I can see my business condition at a glance.
• The dashboard shows today's income and expenses, cash balance, bank/online balance, customer outstanding, supplier outstanding, inventory value, low-stock count and overdue count.
• It also shows recent transactions, upcoming payment reminders, low-stock alerts and a daily/weekly/monthly overview.
• All figures match the underlying records.
Income and Expense
US-4: As an owner or staff member, I want to record income and expenses so that I know where money comes from and goes.
• Each transaction requires amount, date, category and payment method (Cash, Bank, QR/Online), and allows a description and bill photo.
• Given a saved transaction, then the relevant balance and dashboard totals update automatically.
• Given an invalid amount (zero, negative or non-numeric), then it is rejected with an error.
US-5: As an owner, I want to edit or delete transactions with a history so that mistakes can be fixed without losing accountability.
• Given an edit or delete, then the change is saved and an audit entry records who changed what and when.
• I can filter transactions by date, category and payment method.
Customer Udharo
US-6: As an owner, I want to record credit sales and partial payments so that I always know what each customer owes.
• Given a customer with a Rs. 10,000 credit sale and a Rs. 4,000 payment, then the remaining balance shows Rs. 6,000 automatically.
• Each customer has name, phone number, due date and a full transaction history.
• A payment greater than the outstanding balance is rejected or clearly flagged.
US-7: As an owner, I want overdue customers flagged so that I can follow up on time.
• Given a due date has passed and a balance remains, then the customer is marked overdue and an in-app alert shows the amount and due date.
• Given the balance is cleared, then the overdue status is removed.
Supplier / Dealer Payments
US-8: As an owner, I want to record supplier purchases and payments so that I never miss what I owe.
• Given a Rs. 50,000 purchase and a Rs. 20,000 payment, then the remaining payable shows Rs. 30,000 automatically.
• Each supplier has a payment history and due date.
US-9: As an owner, I want overdue supplier payments flagged so that I can pay on time.
• Given a due date has passed with a balance remaining, then an in-app alert shows the supplier name, remaining amount and due date.
Inventory
US-10: As an owner or staff member, I want to manage products and stock so that my records match the shelf.
• A product has name, SKU/code, category, purchase price, selling price, stock, minimum threshold, and optional barcode and supplier.
• Recording a stock purchase increases stock; recording a sale decreases stock; recording damaged or lost stock decreases stock with a reason.
• Manual adjustments require a reason and are logged in the stock movement history.
• Archived products no longer appear in active lists but keep their history.
• Inventory value is calculated automatically from stock and purchase price.
US-11: As an owner, I want low-stock alerts so that I can reorder before running out.
• Given available stock equals or falls below the minimum threshold (for example, A4 Paper with 5 packets against a minimum of 10), then a low-stock alert appears showing the product and quantity.
• Given stock is replenished above the threshold, then the alert clears.
Reports
US-12: As an owner, I want reports so that I can review performance and share data with my accountant.
• Available reports: daily and monthly income/expense, customer outstanding, supplier payable, inventory, low-stock, stock movement and payment history.
• Every report supports date filtering and CSV/Excel export.
• Report totals match the underlying transactions.
Notifications
US-13: As an owner, I want all alerts in one place so that I do not miss important events.
• Low-stock, customer overdue and supplier overdue alerts appear inside the application.
• Each alert shows the relevant item, amount and due date.