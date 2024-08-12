import Server from './server';
import ApplicationConfig  from './applicationConfig';

const startApp = async () => {
  try {
    ApplicationConfig.loadProperties();

    await Server.start();

  } catch(e) {
    console.error(e);
    console.error('Could not start server');
  }
};

startApp().catch(e => console.error(e));