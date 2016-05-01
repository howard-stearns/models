"use strict";
/*jslint vars: true, plusplus: true*/
/*globals Script, Overlays, Controller, Reticle, HMD, Camera, Entities, MyAvatar, Settings, Menu, ScriptDiscoveryService, Window, Vec3, Quat, print */

var mapping = Controller.newMapping(Script.resolvePath(''));
Script.scriptEnding.connect(mapping.disable);
//mapping.from(Controller.Hardware.Keyboard.I).when(Controller.Hardware.Application.SnapTurn).to(Controller.Actions.ReticleClick);

mapping.from(Controller.Hardware.Vive.RS).to(Controller.Actions.ReticleClick);
mapping.from(Controller.Hardware.Vive.RX).to(Controller.Actions.ReticleClick);
mapping.from(Controller.Hardware.Vive.RY).to(Controller.Actions.ReticleClick);

mapping.from(Controller.Hardware.Vive.RT).to(Controller.Actions.ReticleClick);


mapping.enable();

/*
objectName,Hardware,Actions,Standard,destroyed(QObject*),destroyed(),objectNameChanged(QString),deleteLater(),actionEvent(int,float),inputEvent(int,float),hardwareChanged(),captureMouseEvents(),releaseMouseEvents(),captureTouchEvents(),releaseTouchEvents(),captureWheelEvents(),releaseWheelEvents(),captureActionEvents(),releaseActionEvents(),getAllActions(),getAvailableInputs(uint),getDeviceName(uint),getActionValue(int),findDevice(QString),getDeviceNames(),findAction(QString),getActionNames(),getValue(int),getButtonValue(StandardButtonChannel,uint16_t),getButtonValue(StandardButtonChannel),getAxisValue(StandardAxisChannel,uint16_t),getAxisValue(StandardAxisChannel),getPoseValue(int),getPoseValue(StandardPoseChannel,uint16_t),getPoseValue(StandardPoseChannel),newMapping(QString),newMapping(),enableMapping(QString,bool),enableMapping(QString),disableMapping(QString),parseMapping(QString),loadMapping(QString),getHardware(),getActions(),getStandard(),keyPressEvent(KeyEvent),keyReleaseEvent(KeyEvent),actionStartEvent(HFActionEvent),actionEndEvent(HFActionEvent),backStartEvent(),backEndEvent(),mouseMoveEvent(MouseEvent),mousePressEvent(MouseEvent),mouseDoublePressEvent(MouseEvent),mouseReleaseEvent(MouseEvent),touchBeginEvent(TouchEvent),touchEndEvent(TouchEvent),touchUpdateEvent(TouchEvent),wheelEvent(WheelEvent),captureKeyEvents(KeyEvent),releaseKeyEvents(KeyEvent),captureJoystick(int),releaseJoystick(int),getViewportDimensions(),getRecommendedOverlayRect(),createInputController(QString,QString),releaseInputController(controller::InputController*)

Hardware => Actions,Application,Keyboard
Hardware.Actions:
ACTION1,ACTION2,BOOM_IN,BOOM_OUT,Backward,BoomIn,BoomOut,CONTEXT_MENU,ContextMenu,CycleCamera,Down,Forward,LATERAL_LEFT,LATERAL_RIGHT,LEFT_HAND,LEFT_HAND_CLICK,LONGITUDINAL_BACKWARD,LONGITUDINAL_FORWARD,LeftHand,LeftHandClick,PITCH_DOWN,PITCH_UP,Pitch,PitchDown,PitchUp,PrimaryAction,RIGHT_HAND,RIGHT_HAND_CLICK,ReticleClick,ReticleDown,ReticleLeft,ReticleRight,ReticleUp,ReticleX,ReticleY,RightHand,RightHandClick,Roll,SHIFT,SecondaryAction,Shift,StepPitch,StepRoll,StepTranslateX,StepTranslateY,StepTranslateZ,StepYaw,StrafeLeft,StrafeRight,TOGGLE_MUTE,ToggleMute,ToggleOverlay,TranslateX,TranslateY,TranslateZ,UiNavBack,UiNavGroup,UiNavLateral,UiNavSelect,UiNavVertical,Up,VERTICAL_DOWN,VERTICAL_UP,YAW_LEFT,YAW_RIGHT,Yaw,YawLeft,YawRight

Actions:
ACTION1,ACTION2,BOOM_IN,BOOM_OUT,Backward,BoomIn,BoomOut,CONTEXT_MENU,ContextMenu,CycleCamera,Down,Forward,LATERAL_LEFT,LATERAL_RIGHT,LEFT_HAND,LEFT_HAND_CLICK,LONGITUDINAL_BACKWARD,LONGITUDINAL_FORWARD,LeftHand,LeftHandClick,PITCH_DOWN,PITCH_UP,Pitch,PitchDown,PitchUp,PrimaryAction,RIGHT_HAND,RIGHT_HAND_CLICK,ReticleClick,ReticleDown,ReticleLeft,ReticleRight,ReticleUp,ReticleX,ReticleY,RightHand,RightHandClick,Roll,SHIFT,SecondaryAction,Shift,StepPitch,StepRoll,StepTranslateX,StepTranslateY,StepTranslateZ,StepYaw,StrafeLeft,StrafeRight,TOGGLE_MUTE,ToggleMute,ToggleOverlay,TranslateX,TranslateY,TranslateZ,UiNavBack,UiNavGroup,UiNavLateral,UiNavSelect,UiNavVertical,Up,VERTICAL_DOWN,VERTICAL_UP,YAW_LEFT,YAW_RIGHT,Yaw,YawLeft,YawRight

Standard:
A,B,Back,Circle,Cross,DD,DL,DR,DU,Down,L1,L2,L3,LB,LS,LSTouch,LT,LX,LY,Left,LeftGrip,LeftGripTouch,LeftHand,LeftIndexPoint,LeftPrimaryIndex,LeftPrimaryIndexTouch,LeftPrimaryThumb,LeftPrimaryThumbTouch,LeftSecondaryIndex,LeftSecondaryIndexTouch,LeftSecondaryThumb,LeftSecondaryThumbTouch,LeftThumbUp,R1,R2,R3,RB,RS,RSTouch,RT,RX,RY,Right,RightGrip,RightGripTouch,RightHand,RightIndexPoint,RightPrimaryIndex,RightPrimaryIndexTouch,RightPrimaryThumb,RightPrimaryThumbTouch,RightSecondaryIndex,RightSecondaryIndexTouch,RightSecondaryThumb,RightSecondaryThumbTouch,RightThumbUp,Select,Square,Start,Triangle,Up,X,Y
*/
