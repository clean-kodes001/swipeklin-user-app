import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import Intro from '../screens/Onboarding/Intro';
import Welcome from '../screens/Onboarding/Welcome';
import SignUp from '../screens/Onboarding/Signup';
import Login from '../screens/Onboarding/Login';
import SignupOtp from '../screens/Onboarding/SignupOtp';
import CreatePassword from '../screens/Onboarding/CreatePassword';
import Dashboard from '../screens/Dashboard/Dashboard';
import ForgotPassword from '../screens/Onboarding/ForgotPassword';
import ForgotPasswordOtp from '../screens/Onboarding/ForgotPasswordOtp';
import ResetPassword from '../screens/Onboarding/ResetPassword';
import Step1 from '../screens/Profile/Step1';
import Step3 from '../screens/Profile/Step3';
import Step2 from '../screens/Profile/Step2';
import HistoryDetails from '../screens/History/HistoryDetails';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileInfomation from '../screens/Profile/EditProfileInfomation';
import SuccessMessage from '../screens/Dashboard/SuccessMessage';
import DashboardDetails from '../screens/Dashboard/CleanDetails';
import Rate from '../screens/Dashboard/Rate';
import ChatRoom from '../screens/Dashboard/Chat/ChatRoom';
import ProfileInfo from '../screens/Profile/ProfileInfo';
import EditProfileOtp from '../screens/Profile/EditProfileOtp';
import ContactSupport from '../screens/Profile/ContactSupport';
import ContactUs from '../screens/Profile/ContactUs';
import ViewImages from '../screens/Extra/ViewImages';
import BookingDetails from '../screens/Bookings/BookingDetails';
import PaymentMethod from '../screens/Dashboard/Payment/PaymentMethod';
import PaymentMethodContainer from '../screens/Dashboard/Payment/PaymentMethodContainer';
import PaymentDetails from '../screens/Dashboard/Payment/PaymentDetails';
import EditBooking from '../screens/Bookings/EditBooking';
import EnterPassword from '../screens/Onboarding/EnterPassword';
import InviteFriends from '../screens/Profile/InviteFriends';

const Stack = createNativeStackNavigator();

// npx uri-scheme open www.swipeklin.com://dashboard/payment --android
export const config = {
  screens: {
    signup: {
      path: 'signup',
    },
    dashboard: {
      path: 'dashboard/:from',
    },
  },
};
const linking = {
  prefixes: ['www.swipeklin.com://'],
  config,
};

export const Routes = () => {
  const {completedOnboarding, user} = useSelector(state => state.user);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {/* {!completedOnboarding && (
          <>
            <Stack.Screen name="intro" component={Intro} />
          </>
        )} */}
        {user ? (
          !user?.profile ? (
            <>
              <Stack.Screen name="step2" component={Step2} />
              <Stack.Screen name="step1" component={Step1} />
              <Stack.Screen name="step3" component={Step3} />
            </>
          ) : (
            user.profile && (
              <>
                <Stack.Screen name="dashboard" component={Dashboard} />
                <Stack.Screen name="viewimages" component={ViewImages} />
                <Stack.Screen
                  name="successmessage"
                  component={SuccessMessage}
                />

                <Stack.Screen
                  name="paymentmethod"
                  component={PaymentMethodContainer}
                />
                <Stack.Screen
                  name="dashboarddetails"
                  component={DashboardDetails}
                />
                <Stack.Screen
                  name="historydetails"
                  component={HistoryDetails}
                />
                <Stack.Screen
                  name="bookingdetails"
                  component={BookingDetails}
                />
                <Stack.Screen name="editbooking" component={EditBooking} />
                <Stack.Screen
                  name="paymentdetails"
                  component={PaymentDetails}
                />
                <Stack.Screen name="chatroom" component={ChatRoom} />
                <Stack.Screen name="rate" component={Rate} />
                <Stack.Screen name="profile" component={ProfileScreen} />
                <Stack.Screen name="invitefriends" component={InviteFriends} />
                <Stack.Screen
                  name="editprofileotp"
                  component={EditProfileOtp}
                />
                <Stack.Screen
                  name="contactsupport"
                  component={ContactSupport}
                />
                <Stack.Screen name="contactus" component={ContactUs} />
                <Stack.Screen
                  name="editprofileinfo"
                  component={EditProfileInfomation}
                />
                <Stack.Screen name="profileinfo" component={ProfileInfo} />
              </>
            )
          )
        ) : (
          <>
            <Stack.Screen name="welcome" component={Welcome} />
            <Stack.Screen name="forgotpassword" component={ForgotPassword} />
            <Stack.Screen
              name="forgotpasswordotp"
              component={ForgotPasswordOtp}
            />
            <Stack.Screen name="resetpassword" component={ResetPassword} />
            <Stack.Screen name="signupotp" component={SignupOtp} />
            <Stack.Screen name="createpassword" component={CreatePassword} />
            <Stack.Screen name="enterpassword" component={EnterPassword} />
            <Stack.Screen name="signup" component={SignUp} />
            <Stack.Screen name="login" component={Login} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
