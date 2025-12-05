<?php
require_once '../includes/config.php';

class FinanceAPI {
    private $db;
    
    public function __construct() {
        header('Content-Type: application/json');
        try {
            $this->db = new Database();
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
            exit();
        }
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($method === 'GET') {
            $this->handleGetRequest();
        } elseif ($method === 'POST') {
            $this->handlePostRequest($input);
        } else {
            $this->sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
        }
    }
    
    private function handleGetRequest() {
        $action = $_GET['action'] ?? '';

        switch ($action) {
            case 'getBudgetData':
                $this->getBudgetData();
                break;
            case 'getExpenses':
                $this->getExpenses();
                break;
            case 'getCategories':
                $this->getCategories();
                break;
            case 'getUserPoints':
                $this->getUserPoints();
                break;
            case 'getUserBadges':
                $this->getUserBadges();
                break;
            case 'getExpenseTrends':
                $this->getExpenseTrends();
                break;
            case 'getUserProfile':
                $this->getUserProfile();
                break;
            case 'getLeaderboard':
                $this->getLeaderboard();
                break;
            case 'getFixedExpenses':
                $this->getFixedExpenses();
                break;
            case 'getIncomes':
                $this->getIncomes();
                break;
            case 'getIncomeHistory':
                $this->getIncomeHistory();
                break;
            case 'welcome':
                $this->getWelcome();
                break;
            case 'getFeedback':
                $this->getFeedback();
                break;
            default:
                $this->sendResponse(['success' => false, 'error' => 'Invalid action']);
        }
    }
    
    private function handlePostRequest($input) {
        $action = $input['action'] ?? '';

        switch ($action) {
            case 'addExpense':
                $this->addExpense($input);
                break;
            case 'updateExpense':
                $this->updateExpense($input);
                break;
            case 'deleteExpense':
                $this->deleteExpense($input);
                break;
            case 'addIncome':
                $this->addIncome($input);
                break;
            case 'updateIncome':
                $this->updateIncome($input);
                break;
            case 'deleteIncome':
                $this->deleteIncome($input);
                break;
            case 'updateSavingsGoal':
                $this->updateSavingsGoal($input);
                break;
            case 'updateTotalSavings':
                $this->updateTotalSavings($input);
                break;
            case 'addUserPoints':
                $this->addUserPoints($input);
                break;
            case 'addUserBadge':
                $this->addUserBadge($input);
                break;
            case 'updateBudgetData':
                $this->updateBudgetData($input);
                break;
            case 'updateUserPoints':
                $this->updateUserPoints($input);
                break;
            case 'updateUserProfile':
                $this->updateUserProfile($input);
                break;
            case 'updateFixedExpense':
                $this->updateFixedExpense($input);
                break;
            case 'resetIncomeSettings':
                $this->resetIncomeSettings($input);
                break;
            case 'deleteFixedExpense':
                $this->deleteFixedExpense($input);
                break;
            case 'submitFeedback':
                $this->submitFeedback($input);
                break;
            case 'reactFeedback':
                $this->reactFeedback($input);
                break;
            default:
                $this->sendResponse(['success' => false, 'error' => 'Invalid action']);
        }
    }
    
    private function getBudgetData() {
        try {
            $userId = $_GET['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Get budget data
            $budget = $this->db->fetch(
                "SELECT * FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$userId]
            );

            if (!$budget) {
                // Create empty budget data - no default values
                $this->db->execute(
                    "INSERT INTO budget_data (user_id, income, savings_goal, total_savings, duration) VALUES (?, ?, ?, ?, ?)",
                    [$userId, 0, 0, 0, 'monthly']
                );
                $budget = $this->db->fetch(
                    "SELECT * FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                    [$userId]
                );
            }

            // Check for automatic income increment
            $this->checkAndApplyIncomeIncrement($userId, $budget);

            // Check for automatic fixed expense additions
            $this->checkAndAddFixedExpenses($userId);
            
            // Get expenses
            $expenses = $this->db->fetchAll(
                "SELECT e.*, c.name as category_name, c.icon as category_icon 
                 FROM expenses e 
                 JOIN categories c ON e.category_id = c.id 
                 WHERE e.user_id = ? 
                 ORDER BY e.created_at DESC",
                [$userId]
            );
            
            // Format expenses for frontend with calculated percentage
            $formattedExpenses = [];
            $income = (float)$budget['income'];

            foreach ($expenses as $expense) {
                $amount = (float)$expense['amount'];
                $percentage = $income > 0 ? ($amount / $income) * 100 : 0;

                $formattedExpenses[] = [
                    'id' => (string)$expense['id'],
                    'name' => $expense['name'],
                    'amount' => $amount,
                    'percentage' => round($percentage, 1),
                    'category' => $expense['category_name'],
                    'icon' => $expense['category_icon'],
                    'isFixed' => (bool)$expense['is_fixed'],
                    'created_at' => $expense['created_at']
                ];
            }
            
            $budgetData = [
                'income' => (float)$budget['income'],
                'expenses' => $formattedExpenses,
                'savingsGoal' => (float)$budget['savings_goal'],
                'totalSavings' => (float)$budget['total_savings'],
                'duration' => $budget['duration'],
                'incomeIncrementDate' => $budget['income_increment_date'],
                'incomeIncrementAmount' => $budget['income_increment_amount'] ? (float)$budget['income_increment_amount'] : null
            ];
            
            $this->sendResponse(['success' => true, 'data' => $budgetData]);
            
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function getIncomes() {
        try {
            $userId = $_GET['userId'] ?? null;
            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $incomes = $this->db->fetchAll(
                "SELECT * FROM income WHERE user_id = ? ORDER BY date_added DESC",
                [$userId]
            );

            $formattedIncomes = array_map(function($income) {
                return [
                    'id' => $income['id'],
                    'name' => $income['name'],
                    'amount' => (float)$income['amount'],
                    'date_added' => $income['date_added'],
                    'created_at' => $income['created_at'],
                    'is_recurring' => (bool)$income['is_recurring']
                ];
            }, $incomes);

            $this->sendResponse(['success' => true, 'data' => $formattedIncomes]);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function resetIncomeSettings($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Check if budget data exists
            $budget = $this->db->fetch(
                "SELECT id FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$userId]
            );

            if ($budget) {
                // Reset all values to zero and clear increment settings including increment amount
                $this->db->execute(
                    "UPDATE budget_data SET income = 0, savings_goal = 0, total_savings = 0, income_increment_date = NULL, income_increment_amount = NULL, last_increment_month = NULL WHERE id = ?",
                    [$budget['id']]
                );
                
                error_log("Reset income settings for user ID: $userId");
            } else {
                // Create new entry with zeros
                $this->db->execute(
                    "INSERT INTO budget_data (user_id, income, savings_goal, total_savings, duration) VALUES (?, 0, 0, 0, 'monthly')",
                    [$userId]
                );
            }

            // Also delete any income history
            $this->db->execute(
                "DELETE FROM income WHERE user_id = ?",
                [$userId]
            );

            $this->sendResponse(['success' => true, 'message' => 'Income settings reset successfully']);

        } catch (Exception $e) {
            error_log("Error in resetIncomeSettings: " . $e->getMessage());
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function getIncomeHistory() {
        try {
            $userId = $_GET['userId'] ?? null;
            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $startDate = $_GET['startDate'] ?? date('Y-m-01'); // First day of current month
            $endDate = $_GET['endDate'] ?? date('Y-m-t');     // Last day of current month

            $incomes = $this->db->fetchAll(
                "SELECT * FROM income WHERE user_id = ? AND date_added BETWEEN ? AND ? ORDER BY date_added DESC",
                [$userId, $startDate, $endDate]
            );

            $formattedIncomes = array_map(function($income) {
                return [
                    'id' => $income['id'],
                    'name' => $income['name'],
                    'amount' => (float)$income['amount'],
                    'date_added' => $income['date_added'],
                    'created_at' => $income['created_at'],
                    'is_recurring' => (bool)$income['is_recurring']
                ];
            }, $incomes);

            $this->sendResponse(['success' => true, 'data' => $formattedIncomes]);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }


    private function addIncome($input) {
        try {
            $userId = $input['userId'] ?? null;
            $name = $input['name'] ?? 'Income';
            $amount = $input['amount'] ?? 0;
            $date = $input['date'] ?? date('Y-m-d');
            $isRecurring = isset($input['is_recurring']) ? (bool)$input['is_recurring'] : false;
            $incrementDate = $input['incrementDate'] ?? null;

            if (!$userId || $amount <= 0) {
                $this->sendResponse(['success' => false, 'error' => 'User ID and positive amount are required']);
                return;
            }

            $this->db->execute(
                "INSERT INTO income (user_id, name, amount, date_added, is_recurring) VALUES (?, ?, ?, ?, ?)",
                [$userId, $name, $amount, $date, $isRecurring ? 1 : 0]
            );

            // Check if budget data exists
            $budget = $this->db->fetch(
                "SELECT id, income, last_increment_month FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$userId]
            );

            $currentDate = (int)date('j'); // Day of month (1-31)
            $currentMonth = date('Y-m'); // YYYY-MM format

            if ($incrementDate) {
                // This is setting up AUTO-INCREMENT (from Budget Settings or Add Income with increment date)
                $isFutureDate = (int)$incrementDate > $currentDate;
                
                $currentIncome = $budget ? (float)$budget['income'] : 0;
                $existingLastIncrementMonth = $budget ? $budget['last_increment_month'] : null;
                
                // Check if increment already happened this month
                $alreadyIncrementedThisMonth = ($existingLastIncrementMonth === $currentMonth);
                
                // For future dates: keep current income (don't add yet, will add when date arrives)
                // For current/past dates: ADD increment amount ONLY if not already incremented this month
                if ($isFutureDate) {
                    $incomeToSet = $currentIncome; // Keep current, don't add yet
                } else {
                    // Only add increment if we haven't already incremented this month
                    if ($alreadyIncrementedThisMonth) {
                        $incomeToSet = $currentIncome; // Don't add again, already incremented
                    } else {
                        $incomeToSet = $currentIncome + $amount; // ADD to current income
                    }
                }
                
                // IMPORTANT: Preserve last_increment_month if it's already set to current month
                // This prevents duplicate increments when updating settings
                if ($alreadyIncrementedThisMonth) {
                    // Keep existing last_increment_month to prevent duplicate increment this month
                    $lastIncrementMonth = $existingLastIncrementMonth;
                } else {
                    $lastIncrementMonth = $isFutureDate ? null : $currentMonth;
                }
                
                if ($budget) {
                    $this->db->execute(
                        "UPDATE budget_data SET income = ?, income_increment_date = ?, income_increment_amount = ?, last_increment_month = ? WHERE user_id = ?",
                        [$incomeToSet, $incrementDate, $amount, $lastIncrementMonth, $userId]
                    );
                } else {
                    $this->db->execute(
                        "INSERT INTO budget_data (user_id, income, savings_goal, duration, income_increment_date, income_increment_amount, last_increment_month) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [$userId, $incomeToSet, 1000, 'monthly', $incrementDate, $amount, $lastIncrementMonth]
                    );
                }
            } else {
                // This is ONE-TIME INCOME (from Add Income page without increment date)
                // ADD to current income instead of replacing
                $currentIncome = $budget ? (float)$budget['income'] : 0;
                $newIncome = $currentIncome + $amount;
                
                if ($budget) {
                    // Add to existing income
                    $this->db->execute(
                        "UPDATE budget_data SET income = ? WHERE user_id = ?",
                        [$newIncome, $userId]
                    );
                } else {
                    // Create new budget data with the income amount
                    $this->db->execute(
                        "INSERT INTO budget_data (user_id, income, savings_goal, duration) VALUES (?, ?, ?, ?)",
                        [$userId, $amount, 1000, 'monthly']
                    );
                }
            }

            $this->sendResponse(['success' => true, 'message' => 'Income added successfully']);
        } catch (Exception $e) {
            error_log("Error in addIncome: " . $e->getMessage());
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function getExpenses() {
        try {
            $userId = $_GET['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Check for automatic fixed expense additions
            $this->checkAndAddFixedExpenses($userId);

            $expenses = $this->db->fetchAll(
                "SELECT e.*, c.name as category_name, c.icon as category_icon
                 FROM expenses e
                 JOIN categories c ON e.category_id = c.id
                 WHERE e.user_id = ?
                 ORDER BY e.created_at DESC",
                [$userId]
            );

            $this->sendResponse(['success' => true, 'data' => $expenses]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function getCategories() {
        try {
            $categories = $this->db->fetchAll("SELECT * FROM categories ORDER BY name");
            $this->sendResponse(['success' => true, 'data' => $categories]);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function getUserPoints() {
        try {
            $userId = $_GET['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $points = $this->db->fetch(
                "SELECT * FROM user_points WHERE user_id = ?",
                [$userId]
            );

            if (!$points) {
            // Create empty points record
                $this->db->execute(
                    "INSERT INTO user_points (user_id, total_points, months_under_budget, months_no_shopping_entertainment) VALUES (?, ?, ?, ?)",
                    [$userId, 0, 0, 0]
                );
                $points = $this->db->fetch(
                    "SELECT * FROM user_points WHERE user_id = ?",
                    [$userId]
                );
            }

            $this->sendResponse(['success' => true, 'data' => $points]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function getUserBadges() {
        try {
            $userId = $_GET['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Check for automatic fixed expense additions
            $this->checkAndAddFixedExpenses($userId);

            // Check and award badges based on conditions
            $this->checkAndAwardBadges($userId);

            $badges = $this->db->fetchAll(
                "SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC",
                [$userId]
            );

            $badgeNames = array_map(function($badge) {
                return $badge['badge_name'];
            }, $badges);

            $this->sendResponse(['success' => true, 'data' => $badgeNames]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function addExpense($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $expense = $input['expense'];

            // Get category ID
            $category = $this->db->fetch(
                "SELECT id FROM categories WHERE name = ?",
                [$expense['category']]
            );

            if (!$category) {
                $this->sendResponse(['success' => false, 'error' => 'Invalid category']);
                return;
            }

            // Calculate percentage
            $budget = $this->db->fetch(
                "SELECT income FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$userId]
            );

            $income = $budget ? (float)$budget['income'] : 0;
            $percentage = $income > 0 ? (((float)$expense['amount'] / $income) * 100) : 0;

            // Handle fixed expenses - create template if not auto-added
            if ($expense['isFixed'] && !($expense['isAutoAdded'] ?? false)) {
                // Check if due date is provided
                if (!isset($expense['dueDate']) || !$expense['dueDate']) {
                    $this->sendResponse(['success' => false, 'error' => 'Due date is required for fixed expenses']);
                    return;
                }

                // Create fixed expense template (don't add expense immediately)
                $this->db->execute(
                    "INSERT INTO fixed_expenses (user_id, name, amount, category, icon, due_date) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        $userId,
                        $expense['name'],
                        $expense['amount'],
                        $expense['category'],
                        $expense['icon'] ?? '📦',
                        $expense['dueDate']
                    ]
                );

                // Return success without adding the expense
                $templateId = $this->db->lastInsertId();
                $this->sendResponse(['success' => true, 'data' => ['templateId' => $templateId]]);
                return;
            }

            // Insert expense with calculated percentage and explicit timestamp
            $this->db->execute(
                "INSERT INTO expenses (user_id, category_id, name, amount, percentage, is_fixed, is_auto_added, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                [
                    $userId,
                    $category['id'],
                    $expense['name'],
                    $expense['amount'],
                    round($percentage, 1),
                    $expense['isFixed'] ? 1 : 0,
                    $expense['isAutoAdded'] ?? 0
                ]
            );

            $expenseId = $this->db->lastInsertId();

            $this->sendResponse(['success' => true, 'data' => ['id' => $expenseId]]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function updateExpense($input) {
        try {
            $expenseId = $input['expenseId'];
            $expense = $input['expense'];
            
            // Get category ID
            $category = $this->db->fetch(
                "SELECT id FROM categories WHERE name = ?",
                [$expense['category']]
            );
            
            if (!$category) {
                $this->sendResponse(['success' => false, 'error' => 'Invalid category']);
                return;
            }
            
            // Get user ID for the expense to calculate percentage
            $expenseData = $this->db->fetch(
                "SELECT user_id FROM expenses WHERE id = ?",
                [$expenseId]
            );
            
            if (!$expenseData) {
                $this->sendResponse(['success' => false, 'error' => 'Expense not found']);
                return;
            }
            
            // Calculate percentage
            $budget = $this->db->fetch(
                "SELECT income FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$expenseData['user_id']]
            );
            
            $income = $budget ? (float)$budget['income'] : 0;
            $percentage = $income > 0 ? (((float)$expense['amount'] / $income) * 100) : 0;
            
            // Update expense with calculated percentage
            $this->db->execute(
                "UPDATE expenses SET category_id = ?, name = ?, amount = ?, percentage = ?, is_fixed = ?, is_auto_added = ? WHERE id = ?",
                [
                    $category['id'],
                    $expense['name'],
                    $expense['amount'],
                    round($percentage, 1),
                    $expense['isFixed'] ? 1 : 0,
                    $expense['isAutoAdded'] ?? 0,
                    $expenseId
                ]
            );
            
            $this->sendResponse(['success' => true]);
            
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function deleteExpense($input) {
        try {
            $expenseId = $input['expenseId'];
            
            $this->db->execute(
                "DELETE FROM expenses WHERE id = ?",
                [$expenseId]
            );
            
            $this->sendResponse(['success' => true]);
            
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function updateIncome($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $income = $input['income']; // This is the INCREMENT AMOUNT from Budget Settings
            $incrementDate = $input['incrementDate'] ?? null;
            
            // Check if budget data exists
            $budget = $this->db->fetch(
                "SELECT id, income, last_increment_month FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$userId]
            );
            
            $currentDate = (int)date('j'); // Day of month (1-31)
            $currentMonth = date('Y-m'); // YYYY-MM format
            
            if ($incrementDate) {
                // Setting up auto-increment from Budget Settings
                $isFutureDate = (int)$incrementDate > $currentDate;
                $currentIncome = $budget ? (float)$budget['income'] : 0;
                $existingLastIncrementMonth = $budget ? $budget['last_increment_month'] : null;
                
                // Check if increment already happened this month
                $alreadyIncrementedThisMonth = ($existingLastIncrementMonth === $currentMonth);
                
                // For future dates: keep current income, set last_increment_month to NULL (unless already incremented this month)
                // For current/past dates: ADD increment amount ONLY if not already incremented this month
                if ($isFutureDate) {
                    $incomeToSet = $currentIncome; // Keep current, don't add yet
                } else {
                    // Only add increment if we haven't already incremented this month
                    if ($alreadyIncrementedThisMonth) {
                        $incomeToSet = $currentIncome; // Don't add again, already incremented
                    } else {
                        $incomeToSet = $currentIncome + $income; // ADD increment amount
                    }
                }
                
                // IMPORTANT: Preserve last_increment_month if it's already set to current month
                // This prevents duplicate increments when updating settings
                if ($alreadyIncrementedThisMonth) {
                    // Keep existing last_increment_month to prevent duplicate increment this month
                    $lastIncrementMonth = $existingLastIncrementMonth;
                } else {
                    $lastIncrementMonth = $isFutureDate ? null : $currentMonth;
                }
                
                if ($budget) {
                    // Update increment settings and income
                    $this->db->execute(
                        "UPDATE budget_data SET income = ?, income_increment_date = ?, income_increment_amount = ?, last_increment_month = ? WHERE id = ?",
                        [$incomeToSet, $incrementDate, $income, $lastIncrementMonth, $budget['id']]
                    );
                } else {
                    // Create new with increment settings
                    $this->db->execute(
                        "INSERT INTO budget_data (user_id, income, savings_goal, duration, income_increment_date, income_increment_amount, last_increment_month) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [$userId, $incomeToSet, 1000, 'monthly', $incrementDate, $income, $lastIncrementMonth]
                    );
                }
            } else {
                // Removing auto-increment settings
                if ($budget) {
                    $this->db->execute(
                        "UPDATE budget_data SET income_increment_date = NULL, income_increment_amount = NULL, last_increment_month = NULL WHERE id = ?",
                        [$budget['id']]
                    );
                } else {
                    // Create new without increment settings
                    $this->db->execute(
                        "INSERT INTO budget_data (user_id, income, savings_goal, duration) VALUES (?, ?, ?, ?)",
                        [$userId, 0, 1000, 'monthly']
                    );
                }
            }

            // Recalculate percentages for all expenses (use the new income)
            $finalIncome = $budget ? (float)$budget['income'] : 0;
            if ($incrementDate && !$isFutureDate) {
                $finalIncome = $currentIncome + $income;
            }
            $this->recalculateExpensePercentages($userId, $finalIncome);

            $this->sendResponse(['success' => true]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function updateSavingsGoal($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $savingsGoal = $input['savingsGoal'];

            // Check if budget data exists
            $budget = $this->db->fetch(
                "SELECT id FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$userId]
            );

            if ($budget) {
                // Update existing
                $this->db->execute(
                    "UPDATE budget_data SET savings_goal = ? WHERE id = ?",
                    [$savingsGoal, $budget['id']]
                );
            } else {
                // Create new
                $this->db->execute(
                    "INSERT INTO budget_data (user_id, income, savings_goal, total_savings, duration) VALUES (?, ?, ?, ?, ?)",
                    [$userId, 5000, $savingsGoal, 0, 'monthly']
                );
            }

            $this->sendResponse(['success' => true]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function updateTotalSavings($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $totalSavings = $input['totalSavings'];

            // Check if budget data exists
            $budget = $this->db->fetch(
                "SELECT id FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$userId]
            );

            if ($budget) {
                // Update existing
                $this->db->execute(
                    "UPDATE budget_data SET total_savings = ? WHERE id = ?",
                    [$totalSavings, $budget['id']]
                );
            } else {
                // Create new
                $this->db->execute(
                    "INSERT INTO budget_data (user_id, income, savings_goal, total_savings, duration) VALUES (?, ?, ?, ?, ?)",
                    [$userId, 5000, 0, $totalSavings, 'monthly']
                );
            }

            $this->sendResponse(['success' => true]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function addUserPoints($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $points = $input['points'];
            
            // Check if user points exist
            $userPoints = $this->db->fetch(
                "SELECT * FROM user_points WHERE user_id = ?",
                [$userId]
            );
            
            if ($userPoints) {
                // Update existing
                $this->db->execute(
                    "UPDATE user_points SET total_points = total_points + ?, months_under_budget = months_under_budget + 1 WHERE user_id = ?",
                    [$points, $userId]
                );
            } else {
                // Create new
                $this->db->execute(
                    "INSERT INTO user_points (user_id, total_points, months_under_budget, months_no_shopping_entertainment) VALUES (?, ?, ?, ?)",
                    [$userId, $points, 1, 0]
                );
            }
            
            $this->sendResponse(['success' => true]);
            
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function addUserBadge($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $badgeName = $input['badgeName'];
            
            // Check if badge already exists
            $existing = $this->db->fetch(
                "SELECT id FROM user_badges WHERE user_id = ? AND badge_name = ?",
                [$userId, $badgeName]
            );
            
            if (!$existing) {
                $this->db->execute(
                    "INSERT INTO user_badges (user_id, badge_name) VALUES (?, ?)",
                    [$userId, $badgeName]
                );
            }
            
            $this->sendResponse(['success' => true]);
            
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function getExpenseTrends() {
        try {
            $userId = $_GET['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Check for automatic fixed expense additions
            $this->checkAndAddFixedExpenses($userId);

            // Get monthly expense trends for the last 6 months
            $trends = $this->db->fetchAll(
                "SELECT
                    DATE_FORMAT(created_at, '%b') as month,
                    DATE_FORMAT(created_at, '%Y-%m') as year_month,
                    SUM(amount) as expenses
                 FROM expenses
                 WHERE user_id = ?
                   AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY year_month ASC",
                [$userId]
            );

            // If no data, return current month with 0
            if (empty($trends)) {
                $trends = [[
                    'month' => date('M'),
                    'expenses' => 0
                ]];
            }

            $this->sendResponse(['success' => true, 'data' => $trends]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function updateBudgetData($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $budgetData = $input['budgetData'];

            // Update budget data
            $budget = $this->db->fetch(
                "SELECT id FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$userId]
            );

            if ($budget) {
                // Calculate total income from individual income entries
                $totalIncome = $this->db->fetchColumn(
                    "SELECT SUM(amount) FROM income WHERE user_id = ?",
                    [$userId]
                );

                $this->db->execute(
                    "UPDATE budget_data SET income = ?, savings_goal = ?, total_savings = ?, duration = ? WHERE id = ?",
                    [
                        $totalIncome ?? 0, // Use calculated total income
                        $budgetData['savingsGoal'],
                        $budgetData['totalSavings'] ?? 0,
                        $budgetData['duration'],
                        $budget['id']
                    ]
                );
            } else {
                // Calculate total income from individual income entries
                $totalIncome = $this->db->fetchColumn(
                    "SELECT SUM(amount) FROM income WHERE user_id = ?",
                    [$userId]
                );

                $this->db->execute(
                    "INSERT INTO budget_data (user_id, income, savings_goal, total_savings, duration) VALUES (?, ?, ?, ?, ?)",
                    [
                        $userId,
                        $totalIncome ?? 0, // Use calculated total income
                        $budgetData['savingsGoal'],
                        $budgetData['totalSavings'] ?? 0,
                        $budgetData['duration']
                    ]
                );
            }

            $this->sendResponse(['success' => true]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    
    private function updateUserPoints($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $points = $input['points'];

            // Update user points
            $userPoints = $this->db->fetch(
                "SELECT id FROM user_points WHERE user_id = ?",
                [$userId]
            );

            if ($userPoints) {
                $this->db->execute(
                    "UPDATE user_points SET total_points = ?, months_under_budget = ?, months_no_shopping_entertainment = ? WHERE id = ?",
                    [
                        $points['total'],
                        $points['monthsUnderBudget'],
                        $points['monthsNoShoppingEntertainment'] ?? 0,
                        $userPoints['id']
                    ]
                );
            } else {
                $this->db->execute(
                    "INSERT INTO user_points (user_id, total_points, months_under_budget, months_no_shopping_entertainment) VALUES (?, ?, ?, ?)",
                    [
                        $userId,
                        $points['total'],
                        $points['monthsUnderBudget'],
                        $points['monthsNoShoppingEntertainment'] ?? 0
                    ]
                );
            }

            $this->sendResponse(['success' => true]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function getUserProfile() {
        try {
            $userId = $_GET['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Check for automatic fixed expense additions
            $this->checkAndAddFixedExpenses($userId);

            $user = $this->db->fetch(
                "SELECT id, username, first_name, last_name, email, contact, dob, terms_accepted, created_at FROM users WHERE id = ?",
                [$userId]
            );

            if (!$user) {
                $this->sendResponse(['success' => false, 'error' => 'User not found']);
                return;
            }

            $this->sendResponse(['success' => true, 'data' => $user]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function getLeaderboard() {
        try {
            // Check for automatic fixed expense additions for all users
            // This is a global endpoint, so we need to check for all users
            $users = $this->db->fetchAll("SELECT id FROM users", []);
            foreach ($users as $user) {
                $this->checkAndAddFixedExpenses($user['id']);
            }

            // Get top 10 users by total points
            $leaderboard = $this->db->fetchAll(
                "SELECT
                    u.id,
                    u.first_name,
                    u.last_name,
                    up.total_points,
                    up.months_under_budget
                 FROM users u
                 JOIN user_points up ON u.id = up.user_id
                 ORDER BY up.total_points DESC
                 LIMIT 10",
                []
            );

            $this->sendResponse(['success' => true, 'data' => $leaderboard]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function getWelcome() {
        try {
            // Log request metadata
            $method = $_SERVER['REQUEST_METHOD'];
            $path = $_SERVER['REQUEST_URI'];
            error_log("Request received: $method $path");

            $this->sendResponse(['success' => true, 'message' => 'Welcome to the Personal Finance Planner API!']);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function updateUserProfile($input) {
        try {
            $userId = $input['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            $profile = $input['profile'];

            // Validate required fields
            if (empty($profile['first_name']) || empty($profile['last_name']) || empty($profile['email'])) {
                $this->sendResponse(['success' => false, 'error' => 'First name, last name, and email are required']);
                return;
            }

            // Check if email is already taken by another user
            $existingUser = $this->db->fetch(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                [$profile['email'], $userId]
            );

            if ($existingUser) {
                $this->sendResponse(['success' => false, 'error' => 'Email is already taken']);
                return;
            }

            // Update user profile
            $this->db->execute(
                "UPDATE users SET first_name = ?, last_name = ?, email = ?, contact = ?, dob = ? WHERE id = ?",
                [
                    $profile['first_name'],
                    $profile['last_name'],
                    $profile['email'],
                    $profile['contact'] ?: null,
                    $profile['dob'] ?: null,
                    $userId
                ]
            );

            $this->sendResponse(['success' => true]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    

    
    private function recalculateExpensePercentages($userId, $income) {
        try {
            if ($income > 0) {
                // Update all expenses with new percentages
                $this->db->execute(
                    "UPDATE expenses SET percentage = ROUND((amount / ?) * 100, 1) WHERE user_id = ?",
                    [$income, $userId]
                );
            } else {
                // Set all percentages to 0 if income is 0
                $this->db->execute(
                    "UPDATE expenses SET percentage = 0 WHERE user_id = ?",
                    [$userId]
                );
            }
        } catch (Exception $e) {
            // Log error but don't fail the main operation
            error_log("Error recalculating percentages: " . $e->getMessage());
        }
    }
    
    private function checkAndAwardBadges($userId) {
        try {
            // Get user data
            $budget = $this->db->fetch(
                "SELECT * FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                [$userId]
            );

            $userPoints = $this->db->fetch(
                "SELECT * FROM user_points WHERE user_id = ?",
                [$userId]
            );

            $user = $this->db->fetch(
                "SELECT created_at FROM users WHERE id = ?",
                [$userId]
            );

            if (!$budget || !$userPoints || !$user) {
                return; // Cannot check badges without data
            }

            $income = (float)$budget['income'];
            $savingsGoal = (float)$budget['savings_goal'];
            $totalSavings = (float)$budget['total_savings'];
            $monthsUnderBudget = (int)$userPoints['months_under_budget'];
            $monthsNoShoppingEntertainment = (int)$userPoints['months_no_shopping_entertainment'];
            $accountCreatedAt = strtotime($user['created_at']);
            $now = time();
            $accountAgeMonths = floor(($now - $accountCreatedAt) / (30 * 24 * 60 * 60)); // Approximate months

            // Get expenses for current month
            $currentMonthExpenses = $this->db->fetchAll(
                "SELECT e.*, c.name as category_name
                 FROM expenses e
                 JOIN categories c ON e.category_id = c.id
                 WHERE e.user_id = ?
                   AND DATE_FORMAT(e.created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')",
                [$userId]
            );

            $totalExpenses = array_sum(array_column($currentMonthExpenses, 'amount'));
            $isUnderBudget = $income > 0 && $totalExpenses <= $income;

            // Check for shopping/entertainment expenses in current month
            $hasShoppingEntertainment = false;
            foreach ($currentMonthExpenses as $expense) {
                if (in_array(strtolower($expense['category_name']), ['shopping', 'entertainment'])) {
                    $hasShoppingEntertainment = true;
                    break;
                }
            }

            // Badge conditions
            $badgesToCheck = [
                // 1. Savings goal achieved after 1 month
                [
                    'name' => 'Smart Saver',
                    'condition' => $accountAgeMonths >= 1 && $totalSavings >= $savingsGoal && $savingsGoal > 0
                ],
                // 2. Expenses < income for 3 consecutive months
                [
                    'name' => 'Budget Pro',
                    'condition' => $monthsUnderBudget >= 3
                ],
                // 3. No shopping/entertainment expenses for a month
                [
                    'name' => 'Zero Waste',
                    'condition' => !$hasShoppingEntertainment && $totalExpenses > 0 && $monthsNoShoppingEntertainment >= 1
                ],
                // 4. Expenses < income for 6 consecutive months
                [
                    'name' => 'Financial Guru',
                    'condition' => $monthsUnderBudget >= 6
                ],
                // 5. Total savings >= 100000
                [
                    'name' => 'Savings Master',
                    'condition' => $totalSavings >= 100000
                ],
                // 6. Account created 1 month ago
                [
                    'name' => 'First Month',
                    'condition' => $accountAgeMonths >= 1
                ]
            ];

            // Check and award badges
            foreach ($badgesToCheck as $badge) {
                // Check if badge already exists
                $existing = $this->db->fetch(
                    "SELECT id FROM user_badges WHERE user_id = ? AND badge_name = ?",
                    [$userId, $badge['name']]
                );

                if (!$existing && $badge['condition']) {
                    // Award the badge
                    $this->db->execute(
                        "INSERT INTO user_badges (user_id, badge_name) VALUES (?, ?)",
                        [$userId, $badge['name']]
                    );

                    // Add points for the badge
                    $points = [
                        'Smart Saver' => 100,
                        'Budget Pro' => 300,
                        'Zero Waste' => 500,
                        'Financial Guru' => 600,
                        'Savings Master' => 1000,
                        'First Month' => 50
                    ][$badge['name']] ?? 0;

                    if ($points > 0) {
                        $this->db->execute(
                            "UPDATE user_points SET total_points = total_points + ? WHERE user_id = ?",
                            [$points, $userId]
                        );
                    }
                }
            }

            // Update months under budget if current month is under budget
            if ($isUnderBudget) {
                // Check if we already counted this month
                $lastUpdate = $this->db->fetch(
                    "SELECT updated_at FROM user_points WHERE user_id = ?",
                    [$userId]
                );

                if ($lastUpdate) {
                    $lastUpdateMonth = date('Y-m', strtotime($lastUpdate['updated_at']));
                    $currentMonth = date('Y-m');

                    if ($lastUpdateMonth !== $currentMonth) {
                        // New month, increment months under budget
                        $this->db->execute(
                            "UPDATE user_points SET months_under_budget = months_under_budget + 1 WHERE user_id = ?",
                            [$userId]
                        );
                    }
                } else {
                    // First time, set to 1 if under budget
                    $this->db->execute(
                        "UPDATE user_points SET months_under_budget = 1 WHERE user_id = ?",
                        [$userId]
                    );
                }
            } else {
                // Reset months under budget if over budget this month
                $this->db->execute(
                    "UPDATE user_points SET months_under_budget = 0 WHERE user_id = ?",
                    [$userId]
                );
            }

            // Update months with no shopping/entertainment expenses
            if (!$hasShoppingEntertainment && $totalExpenses > 0) {
                // Check if we already counted this month
                $lastUpdate = $this->db->fetch(
                    "SELECT updated_at FROM user_points WHERE user_id = ?",
                    [$userId]
                );

                if ($lastUpdate) {
                    $lastUpdateMonth = date('Y-m', strtotime($lastUpdate['updated_at']));
                    $currentMonth = date('Y-m');

                    if ($lastUpdateMonth !== $currentMonth) {
                        // New month, increment months no shopping/entertainment
                        $this->db->execute(
                            "UPDATE user_points SET months_no_shopping_entertainment = months_no_shopping_entertainment + 1 WHERE user_id = ?",
                            [$userId]
                        );
                    }
                } else {
                    // First time, set to 1 if no shopping/entertainment expenses
                    $this->db->execute(
                        "UPDATE user_points SET months_no_shopping_entertainment = 1 WHERE user_id = ?",
                        [$userId]
                    );
                }
            } else {
                // Reset months no shopping/entertainment if has such expenses this month
                $this->db->execute(
                    "UPDATE user_points SET months_no_shopping_entertainment = 0 WHERE user_id = ?",
                    [$userId]
                );
            }

        } catch (Exception $e) {
            // Log error but don't fail the request
            error_log("Error checking badges: " . $e->getMessage());
        }
    }

    private function checkAndApplyIncomeIncrement($userId, &$budget) {
        try {
            // Check if increment date is set
            if (!$budget['income_increment_date']) {
                return; // No increment date set
            }

            // Check if increment amount is set
            if (!$budget['income_increment_amount'] || $budget['income_increment_amount'] <= 0) {
                return; // No increment amount configured
            }

            $currentDate = (int)date('j'); // Day of month (1-31)
            $currentMonth = date('Y-m'); // YYYY-MM format
            
            // Check if current date is >= increment date AND we haven't incremented this month
            // This handles both current date and past dates that were missed
            if ($currentDate >= (int)$budget['income_increment_date'] && $budget['last_increment_month'] !== $currentMonth) {
                $currentIncome = (float)$budget['income'];
                $incrementAmount = (float)$budget['income_increment_amount'];
                
                // Add the base increment amount (like a monthly salary)
                $newIncome = $currentIncome + $incrementAmount;
                
                // Update last_increment_month first to prevent duplicate increments
                $this->db->execute(
                    "UPDATE budget_data SET income = ?, last_increment_month = ? WHERE id = ?",
                    [$newIncome, $currentMonth, $budget['id']]
                );

                // Update the budget array for the response
                $budget['income'] = $newIncome;
                $budget['last_increment_month'] = $currentMonth;

                // Recalculate expense percentages with new income
                $this->recalculateExpensePercentages($userId, $newIncome);
            }
        } catch (Exception $e) {
            // Log error but don't fail the request
            error_log("Error checking income increment: " . $e->getMessage());
        }
    }

    private function checkAndAddFixedExpenses($userId) {
        try {
            $currentDate = (int)date('j'); // Day of month (1-31)
            $currentMonth = date('Y-m'); // YYYY-MM format

            // Modified query to check for all fixed expenses that haven't been added this month
            // AND are either due today or were due earlier in the month (missed expenses)
            $fixedExpenses = $this->db->fetchAll(
                "SELECT * FROM fixed_expenses WHERE user_id = ? AND due_date <= ? AND (last_added_month IS NULL OR last_added_month != ?)",
                [$userId, $currentDate, $currentMonth]
            );

            foreach ($fixedExpenses as $fixedExpense) {

                // Use case-insensitive category matching
                $category = $this->db->fetch(
                    "SELECT id FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
                    [$fixedExpense['category']]
                );

                if (!$category) {
                    continue;
                }

                $budget = $this->db->fetch(
                    "SELECT income FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                    [$userId]
                );

                $income = $budget ? (float)$budget['income'] : 0;
                $percentage = $income > 0 ? (((float)$fixedExpense['amount'] / $income) * 100) : 0;

                try {
                    $this->db->execute(
                        "INSERT INTO expenses (user_id, category_id, name, amount, percentage, is_fixed, is_auto_added, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                        [
                            $userId,
                            $category['id'],
                            $fixedExpense['name'],
                            $fixedExpense['amount'],
                            round($percentage, 1),
                            1,
                            1
                        ]
                    );
                } catch (Exception $e) {
                    error_log("Error inserting expense: " . $e->getMessage());
                }

                try {
                    // Make sure we're updating with the correct current month format
                    $currentMonth = date('Y-m'); // Ensure YYYY-MM format
                    
                    // Execute the update with explicit transaction handling
                    $this->db->execute(
                        "UPDATE fixed_expenses SET last_added_month = ? WHERE id = ?",
                        [$currentMonth, $fixedExpense['id']]
                    );
                } catch (Exception $e) {
                    error_log("Error updating last_added_month: " . $e->getMessage());
                }
            }
        } catch (Exception $e) {
            error_log("Error checking fixed expenses: " . $e->getMessage());
        }
    }

    private function getFixedExpenses() {
        try {
            $userId = $_GET['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Check for automatic fixed expense additions
            $this->checkAndAddFixedExpenses($userId);

            $fixedExpenses = $this->db->fetchAll(
                "SELECT * FROM fixed_expenses WHERE user_id = ? ORDER BY due_date ASC",
                [$userId]
            );

            $this->sendResponse(['success' => true, 'data' => $fixedExpenses]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function updateFixedExpense($input) {
        try {
            $userId = $input['userId'] ?? null;
            $fixedExpenseId = $input['fixedExpenseId'];
            $fixedExpense = $input['fixedExpense'];

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Verify the expense belongs to the user
            $existingExpense = $this->db->fetch(
                "SELECT id FROM fixed_expenses WHERE id = ? AND user_id = ?",
                [$fixedExpenseId, $userId]
            );

            if (!$existingExpense) {
                $this->sendResponse(['success' => false, 'error' => 'Fixed expense not found or access denied']);
                return;
            }

            // Update fixed expense
            $result = $this->db->execute(
                "UPDATE fixed_expenses SET name = ?, amount = ?, category = ?, icon = ?, due_date = ?, last_added_month = NULL WHERE id = ? AND user_id = ?",
                [
                    $fixedExpense['name'],
                    $fixedExpense['amount'],
                    $fixedExpense['category'],
                    $fixedExpense['icon'] ?? '📦',
                    $fixedExpense['dueDate'],
                    $fixedExpenseId,
                    $userId
                ]
            );

            // Check if due date is today or has already passed this month and add the expense immediately if so
            $currentDate = (int)date('j');
            $dueDate = (int)$fixedExpense['dueDate'];

            if ($dueDate <= $currentDate) {
                // Get category ID (case insensitive and trimmed)
                $category = $this->db->fetch(
                    "SELECT id, name FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
                    [$fixedExpense['category']]
                );

                if ($category) {
                    // Get current income for percentage calculation
                    $budget = $this->db->fetch(
                        "SELECT income FROM budget_data WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                        [$userId]
                    );

                    $income = $budget ? (float)$budget['income'] : 0;
                    $percentage = $income > 0 ? (((float)$fixedExpense['amount'] / $income) * 100) : 0;

                    // Add the expense as auto-added
                    $insertResult = $this->db->execute(
                        "INSERT INTO expenses (user_id, category_id, name, amount, percentage, is_fixed, is_auto_added, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                        [
                            $userId,
                            $category['id'],
                            $fixedExpense['name'],
                            $fixedExpense['amount'],
                            round($percentage, 1),
                            1, // is_fixed
                            1  // is_auto_added
                        ]
                    );

                    if ($insertResult) {
                        // Update last_added_month for the fixed expense
                        $currentMonth = date('Y-m');
                        $this->db->execute(
                            "UPDATE fixed_expenses SET last_added_month = ? WHERE id = ?",
                            [$currentMonth, $fixedExpenseId]
                        );
                    }
                }
            }

            $this->sendResponse(['success' => true]);

        } catch (Exception $e) {
            error_log("Exception in updateFixedExpense: " . $e->getMessage());
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function deleteFixedExpense($input) {
        try {
            $userId = $input['userId'] ?? null;
            $fixedExpenseId = $input['fixedExpenseId'];

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Verify the expense belongs to the user
            $existingExpense = $this->db->fetch(
                "SELECT id FROM fixed_expenses WHERE id = ? AND user_id = ?",
                [$fixedExpenseId, $userId]
            );

            if (!$existingExpense) {
                $this->sendResponse(['success' => false, 'error' => 'Fixed expense not found or access denied']);
                return;
            }

            $this->db->execute(
                "DELETE FROM fixed_expenses WHERE id = ? AND user_id = ?",
                [$fixedExpenseId, $userId]
            );

            $this->sendResponse(['success' => true]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function getFeedback() {
        try {
            $userId = $_GET['userId'] ?? null;

            if (!$userId) {
                $this->sendResponse(['success' => false, 'error' => 'User ID is required']);
                return;
            }

            // Get all feedback
            $feedbacks = $this->db->fetchAll(
                "SELECT * FROM feedback ORDER BY submitted_at DESC"
            );

            // For each feedback, check if the current user has reacted
            $formattedFeedback = [];
            foreach ($feedbacks as $feedback) {
                $reaction = $this->db->fetch(
                    "SELECT reaction FROM feedback_reactions WHERE feedback_id = ? AND user_id = ?",
                    [$feedback['id'], $userId]
                );

                $formattedFeedback[] = [
                    'id' => $feedback['id'],
                    'first_name' => $feedback['first_name'],
                    'last_name' => $feedback['last_name'],
                    'feedback' => $feedback['feedback'],
                    'likes' => (int)$feedback['likes'],
                    'dislikes' => (int)$feedback['dislikes'],
                    'submitted_at' => $feedback['submitted_at'],
                    'userLiked' => $reaction && $reaction['reaction'] === 'like',
                    'userDisliked' => $reaction && $reaction['reaction'] === 'dislike'
                ];
            }

            $this->sendResponse(['success' => true, 'data' => $formattedFeedback]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function submitFeedback($input) {
        try {
            $firstName = $input['firstName'] ?? '';
            $lastName = $input['lastName'] ?? '';
            $feedback = $input['feedback'] ?? '';

            if (empty($firstName) || empty($feedback)) {
                $this->sendResponse(['success' => false, 'error' => 'First name and feedback are required']);
                return;
            }

            $this->db->execute(
                "INSERT INTO feedback (first_name, last_name, feedback, likes, dislikes) VALUES (?, ?, ?, 0, 0)",
                [$firstName, $lastName, $feedback]
            );

            $feedbackId = $this->db->lastInsertId();

            $this->sendResponse(['success' => true, 'data' => ['id' => $feedbackId]]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function reactFeedback($input) {
        try {
            $feedbackId = $input['feedbackId'] ?? null;
            $userId = $input['userId'] ?? null;
            $reaction = $input['reaction'] ?? null; // 'like' or 'dislike'

            if (!$feedbackId || !$userId || !$reaction) {
                $this->sendResponse(['success' => false, 'error' => 'Missing required parameters']);
                return;
            }

            // Check if user has already reacted
            $existingReaction = $this->db->fetch(
                "SELECT reaction FROM feedback_reactions WHERE feedback_id = ? AND user_id = ?",
                [$feedbackId, $userId]
            );

            if ($existingReaction) {
                // If same reaction, remove it (toggle off)
                if ($existingReaction['reaction'] === $reaction) {
                    $this->db->execute(
                        "DELETE FROM feedback_reactions WHERE feedback_id = ? AND user_id = ?",
                        [$feedbackId, $userId]
                    );

                    // Decrement the count
                    $column = $reaction === 'like' ? 'likes' : 'dislikes';
                    $this->db->execute(
                        "UPDATE feedback SET $column = GREATEST(0, $column - 1) WHERE id = ?",
                        [$feedbackId]
                    );
                } else {
                    // Different reaction, update it
                    $this->db->execute(
                        "UPDATE feedback_reactions SET reaction = ? WHERE feedback_id = ? AND user_id = ?",
                        [$reaction, $feedbackId, $userId]
                    );

                    // Update counts: decrement old, increment new
                    $oldColumn = $existingReaction['reaction'] === 'like' ? 'likes' : 'dislikes';
                    $newColumn = $reaction === 'like' ? 'likes' : 'dislikes';
                    $this->db->execute(
                        "UPDATE feedback SET $oldColumn = GREATEST(0, $oldColumn - 1), $newColumn = $newColumn + 1 WHERE id = ?",
                        [$feedbackId]
                    );
                }
            } else {
                // New reaction
                $this->db->execute(
                    "INSERT INTO feedback_reactions (feedback_id, user_id, reaction) VALUES (?, ?, ?)",
                    [$feedbackId, $userId, $reaction]
                );

                // Increment the count
                $column = $reaction === 'like' ? 'likes' : 'dislikes';
                $this->db->execute(
                    "UPDATE feedback SET $column = $column + 1 WHERE id = ?",
                    [$feedbackId]
                );
            }

            $this->sendResponse(['success' => true]);

        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}

// Initialize and handle the request
$api = new FinanceAPI();
$api->handleRequest();
?>
