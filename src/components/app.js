import React from 'react';
import { connect } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';

import store from '../store';
import HeaderBar from './header-bar';
import LandingPage from './landing-page';
import Dashboard from './dashboard';
import RegistrationPage from './registration-page';
import { refreshAuthToken, setWarning, clearAuth } from '../actions/auth';

export class App extends React.Component {
  componentDidUpdate(prevProps) {
    if (!prevProps.loggedIn && this.props.loggedIn) {
      console.log('Logged In');
      // When we are logged in, refresh the auth token periodically
      this.startPeriodicRefresh();
      this.minutesSinceRefresh = 0;
      this.startIdleTimer();
    } else if (prevProps.loggedIn && !this.props.loggedIn) {
      console.log('Logged Out');
      // Stop refreshing when we log out
      this.stopPeriodicRefresh();
      this.stopIdleTimer();
    }
  }

  resetMinTimer() {
    this.minutesSinceRefresh = 0;
    this.props.dispatch(setWarning(null));
  }

  startIdleTimer() {
    this.idleTimer = setInterval(() => {
      this.minutesSinceRefresh++;
      console.log(this.minutesSinceRefresh);
      if (this.minutesSinceRefresh === 4) {
        this.props.dispatch(setWarning(true));
      } else if (this.minutesSinceRefresh === 5) {
        this.props.dispatch(clearAuth());
        this.props.dispatch(setWarning(null));
      }
    }, 1 * 60 * 1000);
  }

  stopIdleTimer() {
    if (!this.idleTimer) {
      return;
    }
    clearInterval(this.idleTimer);
  }

  componentWillUnmount() {
    this.stopPeriodicRefresh();
    this.stopIdleTimer();
  }

  startPeriodicRefresh() {
    this.refreshInterval = setInterval(
      () => this.props.dispatch(refreshAuthToken()),
      10 * 60 * 1000 // One hour
    );
  }

  stopPeriodicRefresh() {
    if (!this.refreshInterval) {
      return;
    }

    clearInterval(this.refreshInterval);
  }

  render() {
    let warningDiv;
    if (this.props.warning) {
      warningDiv = (
        <div>
          <span>WARNING: You are about to be logged out due to inactivity</span>
          <button onClick={() => this.resetMinTimer()}>Remain logged in</button>
        </div>
      );
    }
    return (
      <div className="app">
        <HeaderBar />
        {warningDiv}
        <Route exact path="/" component={LandingPage} />
        <Route exact path="/dashboard" component={Dashboard} />
        <Route exact path="/register" component={RegistrationPage} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  hasAuthToken: state.auth.authToken !== null,
  loggedIn: state.auth.currentUser !== null,
  warning: state.auth.warning
});

// Deal with update blocking - https://reacttraining.com/react-router/web/guides/dealing-with-update-blocking
export default withRouter(connect(mapStateToProps)(App));
