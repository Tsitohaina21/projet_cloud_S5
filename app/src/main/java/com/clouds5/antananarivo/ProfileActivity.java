package com.clouds5.antananarivo;

import android.os.Bundle;
import android.widget.TextView;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class ProfileActivity extends AppCompatActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_profile);

    TextView emailText = findViewById(R.id.textProfileEmail);
    TextView uidText = findViewById(R.id.textProfileUid);
    Button backButton = findViewById(R.id.buttonBack);

    FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
    if (user != null) {
      emailText.setText(user.getEmail() != null ? user.getEmail() : "-");
      uidText.setText(user.getUid());
    } else {
      emailText.setText("-");
      uidText.setText("-");
    }

    backButton.setOnClickListener(v -> finish());
  }
}
