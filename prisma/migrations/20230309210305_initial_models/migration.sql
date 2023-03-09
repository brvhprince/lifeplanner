-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('cash', 'card', 'mobile', 'bank');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'banned', 'suspended');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('yearly', 'monthly', 'weekly', 'daily', 'hourly', 'custom');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('active', 'paused', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "TransactionSatus" AS ENUM ('active', 'reversed');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('active', 'cancelled', 'paid');

-- CreateEnum
CREATE TYPE "ResponsibilityStatus" AS ENUM ('active', 'paused', 'terminated', 'completed');

-- CreateEnum
CREATE TYPE "FuturePlansStatus" AS ENUM ('todo', 'progress', 'paused', 'completed', 'failed', 'abandoned');

-- CreateEnum
CREATE TYPE "EmployerType" AS ENUM ('individual', 'company');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('contract', 'full_time', 'part_time');

-- CreateEnum
CREATE TYPE "EmployerPaymentType" AS ENUM ('salary', 'wages', 'compensations');

-- CreateEnum
CREATE TYPE "EmployerPaymentDuration" AS ENUM ('yearly', 'quartely', 'monthly', 'weekly', 'hourly', 'milestone');

-- CreateEnum
CREATE TYPE "EmployerStatus" AS ENUM ('todo', 'active', 'paused', 'terminated', 'completed');

-- CreateEnum
CREATE TYPE "EmployerContactType" AS ENUM ('email', 'phone', 'link', 'address', 'other');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('personal', 'employer');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('todo', 'active', 'progress', 'paused', 'completed', 'terminated', 'abandoned');

-- CreateEnum
CREATE TYPE "BrandingStatus" AS ENUM ('todo', 'progress', 'paused', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "LearningStatus" AS ENUM ('todo', 'progress', 'paused', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "CareerStatus" AS ENUM ('todo', 'active', 'paused', 'abandoned');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('active', 'reversed');

-- CreateEnum
CREATE TYPE "ProfileGender" AS ENUM ('male', 'female', 'intersex', 'nonconforming', 'other');

-- CreateEnum
CREATE TYPE "InvestmentType" AS ENUM ('stocks', 'bonds', 'cash_equivalent', 'others');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('todo', 'active', 'paused', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "SavingsStatus" AS ENUM ('todo', 'active', 'paused', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ReminderFrequency" AS ENUM ('never', 'daily', 'weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('read', 'unread');

-- CreateEnum
CREATE TYPE "SchduleStatus" AS ENUM ('active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('never', 'daily', 'weekly', 'weekdays', 'weekends', 'fortnightly', 'monthly', 'every3months', 'every6months', 'yearly', 'custom');

-- CreateEnum
CREATE TYPE "ScheduleEndsOn" AS ENUM ('never', 'date');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "other_names" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "image_id" INTEGER,
    "files" TEXT,
    "type" "AccountType" NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "balance" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "status" "Status" NOT NULL DEFAULT 'active',
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "goal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "image_id" INTEGER,
    "files" TEXT,
    "contribution_type" "ContributionType" NOT NULL,
    "custom_type" TEXT,
    "deadline" DATE NOT NULL,
    "metadata" JSONB,
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalSaving" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "savings_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "account_id" TEXT NOT NULL,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalSaving_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "status" "TransactionSatus" NOT NULL,
    "metadata" JSONB,
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCategory" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "metadata" JSONB,
    "status" "Status" NOT NULL DEFAULT 'active',
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "renews" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "account_id" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "SubscriptionStatus" NOT NULL,
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "renews_at" DATE,
    "transaction_id" TEXT,
    "files" TEXT,
    "metadata" JSONB,
    "status" "TransactionSatus" NOT NULL,
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "income_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "renews_at" DATE,
    "transaction_id" TEXT,
    "files" TEXT,
    "metadata" JSONB,
    "status" "TransactionSatus" NOT NULL,
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contents" TEXT NOT NULL,
    "image_id" INTEGER,
    "files" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "debt_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "account_id" TEXT,
    "metadata" JSONB,
    "files" TEXT,
    "due_date" TIMESTAMP(3),
    "paid_date" TIMESTAMP(3),
    "status" "DebtStatus" NOT NULL,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsibility" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "responsibility_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "metadata" JSONB,
    "status" "ResponsibilityStatus" NOT NULL DEFAULT 'active',
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityCategory" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'active',
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponsibilityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuturePlan" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "metadata" JSONB,
    "files" TEXT,
    "expected_date" TIMESTAMP(3),
    "fulfilled_date" TIMESTAMP(3),
    "status" "FuturePlansStatus" NOT NULL DEFAULT 'todo',
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuturePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employer" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employer_type" "EmployerType" NOT NULL,
    "employment_type" "EmploymentType" NOT NULL,
    "payment_type" "EmployerPaymentType" NOT NULL,
    "payment_duration" "EmployerPaymentDuration" NOT NULL,
    "account_id" TEXT,
    "address" TEXT NOT NULL,
    "image_id" INTEGER,
    "metadata" JSONB,
    "status" "EmployerStatus" NOT NULL DEFAULT 'todo',
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerContact" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EmployerContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "status" "Status" NOT NULL DEFAULT 'active',
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_id" INTEGER,
    "project_type" "ProjectType" NOT NULL,
    "files" TEXT,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "income" DOUBLE PRECISION,
    "metadata" JSONB,
    "status" "ProjectStatus" NOT NULL DEFAULT 'todo',
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectUpdate" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "update_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "files" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branding" (
    "id" SERIAL NOT NULL,
    "branding_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "image_id" INTEGER,
    "files" TEXT,
    "metadata" JSONB,
    "status" "BrandingStatus" NOT NULL DEFAULT 'todo',
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandingUpdate" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "update_id" TEXT NOT NULL,
    "branding_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "files" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandingUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memories" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_id" INTEGER,
    "files" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Learning" (
    "id" SERIAL NOT NULL,
    "learning_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "files" TEXT,
    "metadata" JSONB,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "accomplishments" JSONB,
    "accomplished" JSONB,
    "status" "LearningStatus" NOT NULL DEFAULT 'todo',
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Learning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningUpdate" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "update_id" TEXT NOT NULL,
    "learning_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "files" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "avatar_id" INTEGER,
    "cover_id" INTEGER,
    "date_of_birth" DATE,
    "gender" "ProfileGender",
    "place_of_birth" TEXT,
    "other_gender" TEXT,
    "about" TEXT,
    "fun_facts" TEXT,
    "pin_code" INTEGER,
    "security_questions" JSONB,
    "two_fa" BOOLEAN NOT NULL DEFAULT false,
    "two_fa_code" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" SERIAL NOT NULL,
    "relationship_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "files" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipCategory" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image_id" INTEGER,
    "description" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipEntry" (
    "id" SERIAL NOT NULL,
    "relationship_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" INTEGER,
    "tag" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipTag" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image_id" INTEGER,
    "description" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" SERIAL NOT NULL,
    "career_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "files" TEXT,
    "metadata" JSONB,
    "status" "CareerStatus" NOT NULL DEFAULT 'todo',
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerUpdate" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "update_id" TEXT NOT NULL,
    "career_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "files" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTransfer" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "from_" TEXT NOT NULL,
    "to_" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "files" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" SERIAL NOT NULL,
    "investment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "investment_type" "InvestmentType" NOT NULL,
    "other_type" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "account_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "files" TEXT,
    "start_date" DATE,
    "status" "InvestmentStatus" NOT NULL,
    "metadata" JSONB,
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Savings" (
    "id" SERIAL NOT NULL,
    "savings_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "account_id" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "renews_at" DATE NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "image_id" INTEGER,
    "files" TEXT,
    "start_date" DATE,
    "status" "SavingsStatus" NOT NULL,
    "metadata" JSONB,
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Savings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" SERIAL NOT NULL,
    "reminder_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "frequency" "ReminderFrequency" NOT NULL,
    "reminder_date" DATE NOT NULL,
    "reminder_time" TIME NOT NULL,
    "reminder_ends" DATE,
    "image_id" INTEGER,
    "files" TEXT,
    "status" "ReminderStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "report_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "path" TEXT NOT NULL,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "Status" NOT NULL DEFAULT 'active',
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "activity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image_id" INTEGER,
    "files" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'unread',
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" SERIAL NOT NULL,
    "wishlist_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "metadata" JSONB,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_id" INTEGER,
    "files" TEXT,
    "metadata" JSONB,
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleItem" (
    "id" SERIAL NOT NULL,
    "item_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "ScheduleFrequency" NOT NULL,
    "ends_on" "ScheduleEndsOn" NOT NULL DEFAULT 'never',
    "reminder_date" DATE NOT NULL,
    "reminder_time" TIME NOT NULL,
    "reminder_ends" DATE,
    "image" INTEGER,
    "files" TEXT,
    "status" "SchduleStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "message" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_id_key" ON "User"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_hash_key" ON "User"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Account_account_id_key" ON "Account"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Account_hash_key" ON "Account"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_goal_id_key" ON "Goal"("goal_id");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_hash_key" ON "Goal"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "GoalSaving_savings_id_key" ON "GoalSaving"("savings_id");

-- CreateIndex
CREATE UNIQUE INDEX "GoalSaving_hash_key" ON "GoalSaving"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transaction_id_key" ON "Transaction"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_hash_key" ON "Transaction"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategory_category_id_key" ON "TransactionCategory"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategory_hash_key" ON "TransactionCategory"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscription_id_key" ON "Subscription"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_hash_key" ON "Subscription"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_expense_id_key" ON "Expense"("expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_hash_key" ON "Expense"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Income_income_id_key" ON "Income"("income_id");

-- CreateIndex
CREATE UNIQUE INDEX "Income_hash_key" ON "Income"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Note_note_id_key" ON "Note"("note_id");

-- CreateIndex
CREATE UNIQUE INDEX "Note_hash_key" ON "Note"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Debt_debt_id_key" ON "Debt"("debt_id");

-- CreateIndex
CREATE UNIQUE INDEX "Debt_hash_key" ON "Debt"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Responsibility_responsibility_id_key" ON "Responsibility"("responsibility_id");

-- CreateIndex
CREATE UNIQUE INDEX "Responsibility_hash_key" ON "Responsibility"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibilityCategory_category_id_key" ON "ResponsibilityCategory"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibilityCategory_hash_key" ON "ResponsibilityCategory"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "FuturePlan_plan_id_key" ON "FuturePlan"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "FuturePlan_hash_key" ON "FuturePlan"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_employer_id_key" ON "Employer"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_hash_key" ON "Employer"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerContact_contact_id_key" ON "EmployerContact"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerContact_hash_key" ON "EmployerContact"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Project_project_id_key" ON "Project"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "Project_hash_key" ON "Project"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUpdate_update_id_key" ON "ProjectUpdate"("update_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUpdate_hash_key" ON "ProjectUpdate"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Branding_branding_id_key" ON "Branding"("branding_id");

-- CreateIndex
CREATE UNIQUE INDEX "Branding_hash_key" ON "Branding"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "BrandingUpdate_update_id_key" ON "BrandingUpdate"("update_id");

-- CreateIndex
CREATE UNIQUE INDEX "BrandingUpdate_hash_key" ON "BrandingUpdate"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Memories_hash_key" ON "Memories"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Learning_learning_id_key" ON "Learning"("learning_id");

-- CreateIndex
CREATE UNIQUE INDEX "Learning_hash_key" ON "Learning"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "LearningUpdate_update_id_key" ON "LearningUpdate"("update_id");

-- CreateIndex
CREATE UNIQUE INDEX "LearningUpdate_hash_key" ON "LearningUpdate"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_user_id_key" ON "Profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_hash_key" ON "Profile"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_relationship_id_key" ON "Relationship"("relationship_id");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_hash_key" ON "Relationship"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipCategory_category_id_key" ON "RelationshipCategory"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipCategory_hash_key" ON "RelationshipCategory"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipEntry_entry_id_key" ON "RelationshipEntry"("entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipEntry_hash_key" ON "RelationshipEntry"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipTag_tag_id_key" ON "RelationshipTag"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipTag_hash_key" ON "RelationshipTag"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Career_career_id_key" ON "Career"("career_id");

-- CreateIndex
CREATE UNIQUE INDEX "Career_hash_key" ON "Career"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "CareerUpdate_update_id_key" ON "CareerUpdate"("update_id");

-- CreateIndex
CREATE UNIQUE INDEX "CareerUpdate_hash_key" ON "CareerUpdate"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "AccountTransfer_transfer_id_key" ON "AccountTransfer"("transfer_id");

-- CreateIndex
CREATE UNIQUE INDEX "AccountTransfer_hash_key" ON "AccountTransfer"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Investment_investment_id_key" ON "Investment"("investment_id");

-- CreateIndex
CREATE UNIQUE INDEX "Investment_hash_key" ON "Investment"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Savings_savings_id_key" ON "Savings"("savings_id");

-- CreateIndex
CREATE UNIQUE INDEX "Savings_hash_key" ON "Savings"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_reminder_id_key" ON "Reminder"("reminder_id");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_hash_key" ON "Reminder"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Report_report_id_key" ON "Report"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "Report_hash_key" ON "Report"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "File_hash_key" ON "File"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_activity_id_key" ON "Activity"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_hash_key" ON "Activity"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_notification_id_key" ON "Notification"("notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_hash_key" ON "Notification"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_wishlist_id_key" ON "Wishlist"("wishlist_id");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_hash_key" ON "Wishlist"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_schedule_id_key" ON "Schedule"("schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_hash_key" ON "Schedule"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleItem_item_id_key" ON "ScheduleItem"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleItem_hash_key" ON "ScheduleItem"("hash");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "GoalSaving" ADD CONSTRAINT "GoalSaving_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GoalSaving" ADD CONSTRAINT "GoalSaving_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal"("goal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCategory" ADD CONSTRAINT "TransactionCategory_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("transaction_id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "TransactionCategory"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("transaction_id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "TransactionCategory"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ResponsibilityCategory"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FuturePlan" ADD CONSTRAINT "FuturePlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuturePlan" ADD CONSTRAINT "FuturePlan_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EmployerContact" ADD CONSTRAINT "EmployerContact_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "Employer"("employer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branding" ADD CONSTRAINT "Branding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branding" ADD CONSTRAINT "Branding_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "BrandingUpdate" ADD CONSTRAINT "BrandingUpdate_branding_id_fkey" FOREIGN KEY ("branding_id") REFERENCES "Branding"("branding_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memories" ADD CONSTRAINT "Memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memories" ADD CONSTRAINT "Memories_cover_id_fkey" FOREIGN KEY ("cover_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Learning" ADD CONSTRAINT "Learning_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Learning" ADD CONSTRAINT "Learning_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "LearningUpdate" ADD CONSTRAINT "LearningUpdate_learning_id_fkey" FOREIGN KEY ("learning_id") REFERENCES "Learning"("learning_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_cover_id_fkey" FOREIGN KEY ("cover_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "RelationshipCategory"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RelationshipCategory" ADD CONSTRAINT "RelationshipCategory_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "RelationshipEntry" ADD CONSTRAINT "RelationshipEntry_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "Relationship"("relationship_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipTag" ADD CONSTRAINT "RelationshipTag_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Career" ADD CONSTRAINT "Career_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Career" ADD CONSTRAINT "Career_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "CareerUpdate" ADD CONSTRAINT "CareerUpdate_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "Career"("career_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransfer" ADD CONSTRAINT "AccountTransfer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransfer" ADD CONSTRAINT "AccountTransfer_from__fkey" FOREIGN KEY ("from_") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AccountTransfer" ADD CONSTRAINT "AccountTransfer_to__fkey" FOREIGN KEY ("to_") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Savings" ADD CONSTRAINT "Savings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Savings" ADD CONSTRAINT "Savings_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Savings" ADD CONSTRAINT "Savings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "Schedule"("schedule_id") ON DELETE CASCADE ON UPDATE CASCADE;
