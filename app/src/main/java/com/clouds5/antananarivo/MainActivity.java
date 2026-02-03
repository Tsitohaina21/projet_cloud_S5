package com.clouds5.antananarivo;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class MainActivity extends AppCompatActivity {
  private WebView webView;
  private TextView welcomeText;
  private Button profileButton;
  private Button logoutButton;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    webView = findViewById(R.id.webview);
    welcomeText = findViewById(R.id.textWelcome);
    profileButton = findViewById(R.id.buttonProfile);
    logoutButton = findViewById(R.id.buttonLogout);

    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(true);
    settings.setAllowUniversalAccessFromFileURLs(true);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

    webView.setWebViewClient(new WebViewClient());

    String apiUrl = "http://10.0.2.2:8080/api";
    String tilesUrl = "http://10.0.2.2:8082";
    String url = "file:///android_asset/index.html?api=" + apiUrl + "&tiles=" + tilesUrl;
    webView.loadUrl(url);

    profileButton.setOnClickListener(v -> {
      startActivity(new android.content.Intent(MainActivity.this, ProfileActivity.class));
    });

    logoutButton.setOnClickListener(v -> {
      FirebaseAuth.getInstance().signOut();
      startActivity(new android.content.Intent(MainActivity.this, LoginActivity.class));
      finish();
    });
  }

  @Override
  protected void onStart() {
    super.onStart();
    FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
    if (user == null) {
      finish();
      return;
    }

    String email = user.getEmail();
    if (email != null && !email.isEmpty()) {
      welcomeText.setText(getString(R.string.welcome_with_email, email));
    } else {
      welcomeText.setText(R.string.welcome_default);
    }
  }
}
