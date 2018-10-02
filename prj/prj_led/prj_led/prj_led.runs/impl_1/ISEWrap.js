//
//  Vivado(TM)
//  ISEWrap.js: Vivado Runs Script for WSH 5.1/5.6
//  Copyright 1986-1999, 2001-2013,2015 Xilinx, Inc. All Rights Reserved. 
//

// GLOBAL VARIABLES
var ISEShell = new ActiveXObject( "WScript.Shell" );
var ISEFileSys = new ActiveXObject( "Scripting.FileSystemObject" );
var ISERunDir = "";
var ISELogFile = "runme.log";
var ISELogFileStr = null;
var ISELogEcho = true;
var ISEOldVersionWSH = false;



// BOOTSTRAP
ISEInit();



//
// ISE FUNCTIONS
//
function ISEInit() {

  // 1. RUN DIR setup
  var ISEScrFP = WScript.ScriptFullName;
  var ISEScrN = WScript.ScriptName;
  ISERunDir = 
    ISEScrFP.substr( 0, ISEScrFP.length - ISEScrN.length - 1 );

  // 2. LOG file setup
  ISELogFileStr = ISEOpenFile( ISELogFile );

  // 3. LOG echo?
  var ISEScriptArgs = WScript.Arguments;
  for ( var loopi=0; loopi<isescriptargs.length; 1="" loopi++="" )="" {="" if="" (="" isescriptargs(loopi)="=" "-quiet"="" iselogecho="false;" break;="" }="" 4.="" wsh="" version="" check="" var="" iseoptimalversionwsh="5.6;" isecurrentversionwsh="WScript.Version;" <="" isestderr(="" ""="" );="" "warning:="" exploreahead="" works="" best="" with="" microsoft="" "="" +="" or="" higher.="" downloads"="" for="" upgrading="" your="" windows="" scripting="" host="" can="" be="" found="" here:="" http:="" msdn.microsoft.com="" downloads="" list="" webdev.asp"="" iseoldversionwsh="true;" function="" isestep(="" iseprog,="" iseargs="" a="" stop="" file="" isefilesys.fileexists(iserundir="" .stop.rst")="" "***="" halting="" run="" -="" ea="" reset="" detected="" ***"="" wscript.quit(="" write="" step="" header="" to="" log="" isestdout(="" running="" iseprog="" args="" launch!="" iseexitcode="ISEExec(" !="0" iseexec(="" isestep="ISEProg;" (iseprog="=" "realtimefpga"="" ||="" "planahead"="" "vivado")="" ;="" isecmdline="ISEProg" iseargs;="" 5.1="" begin="" creation="" isetouchfile(="" isestep,="" "begin"="" iselogfilestr.close();="">> " + ISELogFile + " 2>&1";
    ISEExitCode = ISEShell.Run( ISECmdLine, 0, true );
    ISELogFileStr = ISEOpenFile( ISELogFile );

  } else {  // WSH 5.6

    // LAUNCH!
    ISEShell.CurrentDirectory = ISERunDir;

    // Redirect STDERR to STDOUT
    ISECmdLine = "%comspec% /c " + ISECmdLine + " 2>&1";
    var ISEProcess = ISEShell.Exec( ISECmdLine );
    
    // BEGIN file creation
    var ISENetwork = WScript.CreateObject( "WScript.Network" );
    var ISEHost = ISENetwork.ComputerName;
    var ISEUser = ISENetwork.UserName;
    var ISEPid = ISEProcess.ProcessID;
    var ISEBeginFile = ISEOpenFile( "." + ISEStep + ".begin.rst" );
    ISEBeginFile.WriteLine( "<?xml version=\"1.0\"?>" );
    ISEBeginFile.WriteLine( "<processhandle version="\" 1\""="" minor="\" 0\""="">" );
    ISEBeginFile.WriteLine( "    <process command="\" ""="" +="" iseprog="" "\"="" owner="\" iseuser="" host="\" isehost="" pid="\" isepid="">" );
    ISEBeginFile.WriteLine( "    </process>" );
    ISEBeginFile.WriteLine( "</processhandle>" );
    ISEBeginFile.Close();
    
    var ISEOutStr = ISEProcess.StdOut;
    var ISEErrStr = ISEProcess.StdErr;
    
    // WAIT for ISEStep to finish
    while ( ISEProcess.Status == 0 ) {
      
      // dump stdout then stderr - feels a little arbitrary
      while ( !ISEOutStr.AtEndOfStream ) {
        ISEStdOut( ISEOutStr.ReadLine() );
      }  
      
      WScript.Sleep( 100 );
    }

    ISEExitCode = ISEProcess.ExitCode;
  }

  ISELogFileStr.Close();

  // END/ERROR file creation
  if ( ISEExitCode != 0 ) {    
    ISETouchFile( ISEStep, "error" );
    
  } else {
    ISETouchFile( ISEStep, "end" );
  }

  return ISEExitCode;
}


//
// UTILITIES
//
function ISEStdOut( ISELine ) {

  ISELogFileStr.WriteLine( ISELine );
  
  if ( ISELogEcho ) {
    WScript.StdOut.WriteLine( ISELine );
  }
}

function ISEStdErr( ISELine ) {
  
  ISELogFileStr.WriteLine( ISELine );

  if ( ISELogEcho ) {
    WScript.StdErr.WriteLine( ISELine );
  }
}

function ISETouchFile( ISERoot, ISEStatus ) {

  var ISETFile = 
    ISEOpenFile( "." + ISERoot + "." + ISEStatus + ".rst" );
  ISETFile.Close();
}

function ISEOpenFile( ISEFilename ) {

  // This function has been updated to deal with a problem seen in CR #870871.
  // In that case the user runs a script that runs impl_1, and then turns around
  // and runs impl_1 -to_step write_bitstream. That second run takes place in
  // the same directory, which means we may hit some of the same files, and in
  // particular, we will open the runme.log file. Even though this script closes
  // the file (now), we see cases where a subsequent attempt to open the file
  // fails. Perhaps the OS is slow to release the lock, or the disk comes into
  // play? In any case, we try to work around this by first waiting if the file
  // is already there for an arbitrary 5 seconds. Then we use a try-catch block
  // and try to open the file 10 times with a one second delay after each attempt.
  // Again, 10 is arbitrary. But these seem to stop the hang in CR #870871.
  // If there is an unrecognized exception when trying to open the file, we output
  // an error message and write details to an exception.log file.
  var ISEFullPath = ISERunDir + "/" + ISEFilename;
  if (ISEFileSys.FileExists(ISEFullPath)) {
    // File is already there. This could be a problem. Wait in case it is still in use.
    WScript.Sleep(5000);
  }
  var i;
  for (i = 0; i < 10; ++i) {
    try {
      return ISEFileSys.OpenTextFile(ISEFullPath, 8, true);
    } catch (exception) {
      var error_code = exception.number & 0xFFFF; // The other bits are a facility code.
      if (error_code == 52) { // 52 is bad file name or number.
        // Wait a second and try again.
        WScript.Sleep(1000);
        continue;
      } else {
        WScript.StdErr.WriteLine("ERROR: Exception caught trying to open file " + ISEFullPath);
        var exceptionFilePath = ISERunDir + "/exception.log";
        if (!ISEFileSys.FileExists(exceptionFilePath)) {
          WScript.StdErr.WriteLine("See file " + exceptionFilePath + " for details.");
          var exceptionFile = ISEFileSys.OpenTextFile(exceptionFilePath, 8, true);
          exceptionFile.WriteLine("ERROR: Exception caught trying to open file " + ISEFullPath);
          exceptionFile.WriteLine("\tException name: " + exception.name);
          exceptionFile.WriteLine("\tException error code: " + error_code);
          exceptionFile.WriteLine("\tException message: " + exception.message);
          exceptionFile.Close();
        }
        throw exception;
      }
    }
  }
  // If we reached this point, we failed to open the file after 10 attempts.
  // We need to error out.
  WScript.StdErr.WriteLine("ERROR: Failed to open file " + ISEFullPath);
  WScript.Quit(1);
}
</isescriptargs.length;>