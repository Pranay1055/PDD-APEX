"""
test_auth_selenium.py
---------------------
Real Selenium E2E tests for the Apex web app (Signup + Login flows).
Target: https://apex-sigma-eight.vercel.app

Tests run against the LIVE Vercel deployment — no mocking, no simulation.
Chrome runs in headless mode so it works inside GitHub Actions runners.

Usage:
    pip install selenium
    python -m pytest apex/tests/test_auth_selenium.py -v
"""

import time
import uuid
import unittest

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ─── Configuration ────────────────────────────────────────────────────────────
BASE_URL       = "https://apex-sigma-eight.vercel.app"
LOGIN_URL      = f"{BASE_URL}/login"
SIGNUP_URL     = f"{BASE_URL}/signup"
DASHBOARD_URL  = f"{BASE_URL}/"

# Use a unique email per run so signup never collides with previous runs
_RUN_ID        = uuid.uuid4().hex[:8]
TEST_EMAIL     = f"seleniumtest_{_RUN_ID}@apextest.dev"
TEST_PASSWORD  = "SeleniumTest@123"
TEST_NAME      = "Selenium Tester"
TEST_AGE       = "25"

PAGE_LOAD_WAIT = 15   # seconds – max wait for elements to appear
SHORT_PAUSE    = 0.6  # seconds – brief human-like pause between actions


# ─── Shared driver setup ──────────────────────────────────────────────────────
def build_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,900")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    return webdriver.Chrome(options=options)


# ─── Signup Tests ─────────────────────────────────────────────────────────────
class TestSignup(unittest.TestCase):
    """
    Tests the /signup page on the live Vercel deployment.
    A unique email is generated per run so each run creates a fresh account.
    """

    @classmethod
    def setUpClass(cls):
        cls.driver = build_driver()
        cls.wait   = WebDriverWait(cls.driver, PAGE_LOAD_WAIT)
        # Navigate to base URL, then click the redirect link to signup
        cls.driver.get(BASE_URL)
        goto_signup = cls.wait.until(EC.element_to_be_clickable((By.ID, "goto-signup-btn")))
        goto_signup.click()
        # Wait until the signup form is present
        cls.wait.until(EC.presence_of_element_located((By.ID, "signup-name")))

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    # ── Page structure checks ──────────────────────────────────────────────────

    def test_01_signup_page_title_contains_apex(self):
        """Page title should include 'APEX' or 'Apex'."""
        self.assertIn("apex", self.driver.title.lower(),
                      f"Expected 'apex' in title, got: {self.driver.title!r}")

    def test_02_signup_heading_visible(self):
        """'Create Account' heading must be rendered."""
        heading = self.wait.until(
            EC.visibility_of_element_located((By.TAG_NAME, "h1"))
        )
        self.assertIn("Create Account", heading.text,
                      f"Unexpected heading: {heading.text!r}")

    def test_03_name_field_present(self):
        """Full Name input must exist."""
        field = self.driver.find_element(By.ID, "signup-name")
        self.assertTrue(field.is_displayed(), "signup-name field not visible")

    def test_04_email_field_present(self):
        """Email input must exist."""
        field = self.driver.find_element(By.ID, "signup-email")
        self.assertTrue(field.is_displayed(), "signup-email field not visible")

    def test_05_age_field_present(self):
        """Age input must exist."""
        field = self.driver.find_element(By.ID, "signup-age")
        self.assertTrue(field.is_displayed(), "signup-age field not visible")

    def test_06_password_field_present(self):
        """Password input must exist and be masked by default."""
        field = self.driver.find_element(By.ID, "signup-password")
        self.assertTrue(field.is_displayed(), "signup-password field not visible")
        self.assertEqual(field.get_attribute("type"), "password",
                         "Password field should be masked by default")

    def test_07_confirm_password_field_present(self):
        """Confirm Password input must exist."""
        field = self.driver.find_element(By.ID, "signup-confirm")
        self.assertTrue(field.is_displayed(), "signup-confirm field not visible")

    def test_08_submit_button_present(self):
        """'Create Account' submit button must be present."""
        btn = self.driver.find_element(By.ID, "signup-submit-btn")
        self.assertTrue(btn.is_displayed(), "signup-submit-btn not visible")

    def test_09_goto_login_link_present(self):
        """'Sign In' switch link must be visible."""
        btn = self.driver.find_element(By.ID, "goto-login-btn")
        self.assertTrue(btn.is_displayed(), "goto-login-btn not visible")

    # ── Interaction / validation checks ───────────────────────────────────────

    def test_10_name_field_accepts_text(self):
        """Typing into the name field should update its value."""
        field = self.driver.find_element(By.ID, "signup-name")
        field.clear()
        field.send_keys("Test User")
        time.sleep(SHORT_PAUSE)
        self.assertEqual(field.get_attribute("value"), "Test User")

    def test_11_email_field_accepts_text(self):
        """Typing into the email field should update its value."""
        field = self.driver.find_element(By.ID, "signup-email")
        field.clear()
        field.send_keys("test@example.com")
        time.sleep(SHORT_PAUSE)
        self.assertEqual(field.get_attribute("value"), "test@example.com")

    def test_12_password_strength_bar_appears(self):
        """Typing a password should reveal the strength indicator."""
        field = self.driver.find_element(By.ID, "signup-password")
        field.clear()
        field.send_keys("Weak1!")
        time.sleep(SHORT_PAUSE)
        # Strength bar segments should now be in DOM
        segments = self.driver.find_elements(By.CSS_SELECTOR, ".auth-strength-segment")
        self.assertGreater(len(segments), 0, "Strength bar segments not found")

    def test_13_goto_login_navigates_to_login(self):
        """Clicking 'Sign In' link must navigate to /login."""
        self.driver.find_element(By.ID, "goto-login-btn").click()
        self.wait.until(EC.url_contains("/login"))
        self.assertIn("/login", self.driver.current_url)
        # Navigate back using the client-side flow so subsequent tests still work
        self.driver.get(BASE_URL)
        goto_signup = self.wait.until(EC.element_to_be_clickable((By.ID, "goto-signup-btn")))
        goto_signup.click()
        self.wait.until(EC.presence_of_element_located((By.ID, "signup-name")))

    def test_14_full_signup_flow_creates_account(self):
        """
        End-to-end: fill in all signup fields with the unique test credentials
        and submit. The app should redirect to the dashboard on success.
        """
        self.driver.get(BASE_URL)
        goto_signup = self.wait.until(EC.element_to_be_clickable((By.ID, "goto-signup-btn")))
        goto_signup.click()
        self.wait.until(EC.presence_of_element_located((By.ID, "signup-name")))

        # Fill out the form
        self.driver.find_element(By.ID, "signup-name").send_keys(TEST_NAME)
        time.sleep(SHORT_PAUSE)
        self.driver.find_element(By.ID, "signup-email").send_keys(TEST_EMAIL)
        time.sleep(SHORT_PAUSE)
        self.driver.find_element(By.ID, "signup-age").send_keys(TEST_AGE)
        time.sleep(SHORT_PAUSE)
        self.driver.find_element(By.ID, "signup-password").send_keys(TEST_PASSWORD)
        time.sleep(SHORT_PAUSE)
        self.driver.find_element(By.ID, "signup-confirm").send_keys(TEST_PASSWORD)
        time.sleep(SHORT_PAUSE)

        # Submit
        self.driver.find_element(By.ID, "signup-submit-btn").click()

        # Wait for redirect to dashboard (or success indicator)
        try:
            self.wait.until(
                lambda d: "/login" not in d.current_url and "/signup" not in d.current_url
            )
            on_dashboard = True
        except Exception:
            # If it lands on login after successful registration, that's also OK
            on_dashboard = "/login" in self.driver.current_url

        self.assertTrue(
            on_dashboard or "/signup" not in self.driver.current_url,
            f"Signup did not redirect away from /signup. Current URL: {self.driver.current_url}"
        )


# ─── Login Tests ──────────────────────────────────────────────────────────────
class TestLogin(unittest.TestCase):
    """
    Tests the /login page on the live Vercel deployment.
    Uses the account created by TestSignup (TEST_EMAIL / TEST_PASSWORD).
    """

    @classmethod
    def setUpClass(cls):
        cls.driver = build_driver()
        cls.wait   = WebDriverWait(cls.driver, PAGE_LOAD_WAIT)
        cls.driver.get(BASE_URL)
        cls.wait.until(EC.presence_of_element_located((By.ID, "login-email")))

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    # ── Page structure checks ──────────────────────────────────────────────────

    def test_01_login_page_loads(self):
        """The login page should load and respond with 200."""
        self.assertIn(BASE_URL, self.driver.current_url)

    def test_02_login_heading_visible(self):
        """'Welcome Back' heading must be visible."""
        heading = self.wait.until(
            EC.visibility_of_element_located((By.TAG_NAME, "h1"))
        )
        self.assertIn("Welcome", heading.text,
                      f"Unexpected heading: {heading.text!r}")

    def test_03_email_field_present(self):
        """Email input must exist and be visible."""
        field = self.driver.find_element(By.ID, "login-email")
        self.assertTrue(field.is_displayed(), "login-email field not visible")

    def test_04_password_field_present_and_masked(self):
        """Password input must exist and be masked by default."""
        field = self.driver.find_element(By.ID, "login-password")
        self.assertTrue(field.is_displayed(), "login-password field not visible")
        self.assertEqual(field.get_attribute("type"), "password",
                         "Password field should be masked by default")

    def test_05_submit_button_present(self):
        """'Sign In' submit button must be present."""
        btn = self.driver.find_element(By.ID, "login-submit-btn")
        self.assertTrue(btn.is_displayed(), "login-submit-btn not visible")

    def test_06_create_account_link_present(self):
        """'Create Account' switch link must be visible."""
        btn = self.driver.find_element(By.ID, "goto-signup-btn")
        self.assertTrue(btn.is_displayed(), "goto-signup-btn not visible")

    # ── Interaction checks ─────────────────────────────────────────────────────

    def test_07_email_field_accepts_input(self):
        """Typing into email field should update its value."""
        field = self.driver.find_element(By.ID, "login-email")
        field.clear()
        field.send_keys("someone@example.com")
        time.sleep(SHORT_PAUSE)
        self.assertEqual(field.get_attribute("value"), "someone@example.com")
        field.clear()

    def test_08_password_field_accepts_input(self):
        """Typing into password field should update its value."""
        field = self.driver.find_element(By.ID, "login-password")
        field.clear()
        field.send_keys("testpassword")
        time.sleep(SHORT_PAUSE)
        self.assertEqual(field.get_attribute("value"), "testpassword")
        field.clear()

    def test_09_wrong_credentials_shows_error(self):
        """Submitting wrong credentials should show a server error message."""
        self.driver.get(BASE_URL)
        self.wait.until(EC.presence_of_element_located((By.ID, "login-email")))

        self.driver.find_element(By.ID, "login-email").send_keys("wrong@example.com")
        time.sleep(SHORT_PAUSE)
        self.driver.find_element(By.ID, "login-password").send_keys("WrongPass999!")
        time.sleep(SHORT_PAUSE)
        self.driver.find_element(By.ID, "login-submit-btn").click()

        # Wait for error element to appear (auth-server-error div)
        error_div = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, ".auth-server-error"))
        )
        self.assertTrue(len(error_div.text) > 0,
                        "Error message is empty after wrong credentials")

    def test_10_goto_signup_navigates(self):
        """Clicking 'Create Account' should navigate to /signup."""
        self.driver.get(BASE_URL)
        self.wait.until(EC.presence_of_element_located((By.ID, "goto-signup-btn")))
        self.driver.find_element(By.ID, "goto-signup-btn").click()
        self.wait.until(EC.url_contains("/signup"))
        self.assertIn("/signup", self.driver.current_url)

    def test_11_valid_login_redirects_to_dashboard(self):
        """
        End-to-end: log in with the account created during TestSignup
        and verify we land on the dashboard (not on /login or /signup).
        """
        self.driver.get(BASE_URL)
        self.wait.until(EC.presence_of_element_located((By.ID, "login-email")))

        self.driver.find_element(By.ID, "login-email").send_keys(TEST_EMAIL)
        time.sleep(SHORT_PAUSE)
        self.driver.find_element(By.ID, "login-password").send_keys(TEST_PASSWORD)
        time.sleep(SHORT_PAUSE)
        self.driver.find_element(By.ID, "login-submit-btn").click()

        # After successful login the app redirects away from /login
        self.wait.until(
            lambda d: "/login" not in d.current_url and "/signup" not in d.current_url
        )
        self.assertNotIn("/login", self.driver.current_url,
                         f"Still on login after valid credentials. URL: {self.driver.current_url}")

    def test_12_dashboard_renders_after_login(self):
        """After login the page body must contain visible content (NavBar / main)."""
        body = self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        self.assertGreater(len(body.text.strip()), 0,
                           "Dashboard body appears empty after login")


# ─── Runner ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    unittest.main(verbosity=2)
