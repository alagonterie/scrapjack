import * as React from 'react';
import {AnalyticsProvider, useFirebaseApp, useAnalytics} from 'reactfire';
import {getAnalytics, logEvent} from 'firebase/analytics';
import {useEffect} from 'react';


function MyPageViewLogger() {
  const analytics = useAnalytics();

  useEffect(() => {
    logEvent(analytics, 'page_view', {page_location: window.location.href});
  }, [analytics]);

  return null;
}

export function Analytics() {
  const app = useFirebaseApp();
  return (
    <AnalyticsProvider sdk={getAnalytics(app)}>
      <MyPageViewLogger/>
    </AnalyticsProvider>
  );
}
