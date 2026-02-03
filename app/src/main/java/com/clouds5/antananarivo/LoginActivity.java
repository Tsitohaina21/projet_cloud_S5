package com.clouds5.antananarivo;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class LoginActivity extends AppCompatActivity {
  private FirebaseAuth auth;
  private boolean isRegisterMode = false;

  private EditText emailInput;
  private EditText passwordInput;
  private EditText confirmPasswordInput;
  private Button primaryButton;
  private TextView toggleText;
  private TextView errorText;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_login);

    auth = FirebaseAuth.getInstance();

    emailInput = findViewById(R.id.inputEmail);
    passwordInput = findViewById(R.id.inputPassword);
    confirmPasswordInput = findViewById(R.id.inputConfirmPassword);
    primaryButton = findViewById(R.id.buttonPrimary);
    toggleText = findViewById(R.id.textToggle);
    errorText = findViewById(R.id.textError);

    primaryButton.setOnClickListener(v -> handlePrimaryAction());
    toggleText.setOnClickListener(v -> toggleMode());
  }

  @Override
  protected void onStart() {
    super.onStart();
    FirebaseUser currentUser = auth.getCurrentUser();
    if (currentUser != null) {
      goToMap();
    }
  }

  private void toggleMode() {
    isRegisterMode = !isRegisterMode;
    if (isRegisterMode) {
      confirmPasswordInput.setVisibility(View.VISIBLE);
      primaryButton.setText(R.string.action_register);
      toggleText.setText(R.string.toggle_login);
    } else {
      confirmPasswordInput.setVisibility(View.GONE);
      primaryButton.setText(R.string.action_login);
      toggleText.setText(R.string.toggle_register);
    }
    errorText.setText("");
  }

  private void handlePrimaryAction() {
    String email = emailInput.getText().toString().trim();
    String password = passwordInput.getText().toString().trim();
    String confirmPassword = confirmPasswordInput.getText().toString().trim();

    if (email.isEmpty() || password.isEmpty()) {
      errorText.setText(R.string.error_missing_fields);
      return;
    }

    if (isRegisterMode) {
      if (confirmPassword.isEmpty()) {
        errorText.setText(R.string.error_missing_fields);
        return;
      }
      if (!password.equals(confirmPassword)) {
        errorText.setText(R.string.error_password_mismatch);
        return;
      }
      createAccount(email, password);
    } else {
      signIn(email, password);
    }
  }

  private void createAccount(String email, String password) {
    auth.createUserWithEmailAndPassword(email, password)
      .addOnCompleteListener(this, task -> {
        if (task.isSuccessful()) {
          goToMap();
        } else {
          String message = task.getException() != null ? task.getException().getMessage() : getString(R.string.error_generic);
          errorText.setText(message);
        }
      });
  }

  private void signIn(String email, String password) {
    auth.signInWithEmailAndPassword(email, password)
      .addOnCompleteListener(this, task -> {
        if (task.isSuccessful()) {
          goToMap();
        } else {
          String message = task.getException() != null ? task.getException().getMessage() : getString(R.string.error_generic);
          errorText.setText(message);
        }
      });
  }

  private void goToMap() {
    Intent intent = new Intent(LoginActivity.this, MainActivity.class);
    startActivity(intent);
    finish();
  }
}
